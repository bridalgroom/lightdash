import {
    CreateInitialUserArgs,
    CreateInviteLink,
    CreateOrganizationUser,
    InviteLink,
    LightdashMode,
    LightdashUser,
    SessionUser,
    UpdateUserArgs,
} from 'common';
import { nanoid } from 'nanoid';
import { analytics, identifyUser } from '../analytics/client';
import { lightdashConfig } from '../config/lightdashConfig';
import { updatePassword } from '../database/entities/passwordLogins';
import {
    AuthorizationError,
    ForbiddenError,
    NotExistsError,
    NotFoundError,
} from '../errors';
import { EmailModel } from '../models/EmailModel';
import { InviteLinkModel } from '../models/InviteLinkModel';
import { SessionModel } from '../models/SessionModel';
import { UserModel } from '../models/UserModel';

type UserServiceDependencies = {
    inviteLinkModel: InviteLinkModel;
    userModel: UserModel;
    sessionModel: SessionModel;
    emailModel: EmailModel;
};

export class UserService {
    private readonly inviteLinkModel: InviteLinkModel;

    private readonly userModel: UserModel;

    private readonly sessionModel: SessionModel;

    private readonly emailModel: EmailModel;

    constructor({
        inviteLinkModel,
        userModel,
        sessionModel,
        emailModel,
    }: UserServiceDependencies) {
        this.inviteLinkModel = inviteLinkModel;
        this.userModel = userModel;
        this.sessionModel = sessionModel;
        this.emailModel = emailModel;
    }

    async create(
        createOrganizationUser: CreateOrganizationUser,
    ): Promise<LightdashUser> {
        const user = await this.userModel.createUser(createOrganizationUser);
        identifyUser(user);
        analytics.track({
            organizationId: user.organizationUuid,
            event: 'user.created',
            userId: user.userUuid,
        });
        return user;
    }

    async delete(user: SessionUser, userUuid: string): Promise<void> {
        if (user.organizationUuid === undefined) {
            throw new NotExistsError('Organization not found');
        }

        const users = await this.userModel.getAllByOrganization(
            user.organizationUuid,
        );
        if (users.length <= 1) {
            throw new ForbiddenError(
                'Organization needs to have at least one user',
            );
        }

        await this.sessionModel.deleteAllByUserUuid(userUuid);

        await this.userModel.delete(userUuid);
        analytics.track({
            organizationId: user.organizationUuid,
            event: 'user.deleted',
            userId: user.userUuid,
            properties: {
                deletedUserUuid: userUuid,
            },
        });
    }

    async createOrganizationInviteLink(
        user: SessionUser,
        createInviteLink: CreateInviteLink,
    ): Promise<InviteLink> {
        const { organizationUuid } = user;
        const { expiresAt } = createInviteLink;
        const inviteCode = nanoid(30);
        if (organizationUuid === undefined) {
            throw new NotExistsError('Organization not found');
        }
        const inviteLink = await this.inviteLinkModel.create(
            inviteCode,
            expiresAt,
            organizationUuid,
        );
        analytics.track({
            organizationId: organizationUuid,
            userId: user.userUuid,
            event: 'invite_link.created',
        });
        return inviteLink;
    }

    async revokeAllInviteLinks(user: SessionUser) {
        const { organizationUuid } = user;
        if (organizationUuid === undefined) {
            throw new NotExistsError('Organization not found');
        }
        await this.inviteLinkModel.deleteByOrganization(organizationUuid);
        analytics.track({
            organizationId: organizationUuid,
            userId: user.userUuid,
            event: 'invite_link.all_revoked',
        });
    }

    async loginWithOpenId(issuer: string, subject: string, email: string) {
        try {
            // User exists with OpenId
            return await this.userModel.getUserByOpenId(issuer, subject);
        } catch (getUserError) {
            if (getUserError instanceof NotFoundError) {
                // Check email
                try {
                    const existingEmail =
                        await this.emailModel.getEmailByAddress(email);
                    // Associate account with email
                } catch (getEmailError) {
                    if (getEmailError instanceof NotFoundError) {
                        // Create a new account
                    }
                    throw getEmailError;
                }
            }
            throw getUserError;
        }
    }

    async getInviteLink(inviteCode: string): Promise<InviteLink> {
        const inviteLink = await this.inviteLinkModel.findByCode(inviteCode);
        const now = new Date();
        if (inviteLink.expiresAt <= now) {
            try {
                await this.inviteLinkModel.deleteByCode(inviteLink.inviteCode);
            } catch (e) {
                throw new NotExistsError('Invite link not found');
            }
            throw new NotExistsError('Invite link expired');
        }
        return inviteLink;
    }

    async loginWithPassword(
        email: string,
        password: string,
    ): Promise<LightdashUser> {
        try {
            // TODO: move to authorization service layer
            const user = await this.userModel.getUserByPrimaryEmailAndPassword(
                email,
                password,
            );
            identifyUser(user);
            analytics.track({
                organizationId: user.organizationUuid,
                userId: user.userUuid,
                event: 'user.logged_in',
            });
            return user;
        } catch (e) {
            if (e instanceof NotFoundError) {
                throw new AuthorizationError(
                    'Email and password not recognized',
                );
            }
            throw e;
        }
    }

    async updatePassword(
        userId: number,
        userUuid: string,
        data: { password: string; newPassword: string },
    ): Promise<void> {
        // Todo: Move to authorization service layer
        let user: LightdashUser;
        try {
            user = await this.userModel.getUserByUuidAndPassword(
                userUuid,
                data.password,
            );
        } catch (e) {
            if (e instanceof NotFoundError) {
                throw new AuthorizationError('Password not recognized.');
            }
            throw e;
        }
        await updatePassword(userId, data.newPassword);
        analytics.track({
            userId: user.userUuid,
            organizationId: user.organizationUuid,
            event: 'password.updated',
        });
    }

    async updateUser(
        userId: number,
        currentEmail: string | undefined,
        data: UpdateUserArgs,
    ): Promise<LightdashUser> {
        const user = await this.userModel.updateUser(
            userId,
            currentEmail,
            data,
        );
        identifyUser(user);
        analytics.track({
            userId: user.userUuid,
            organizationId: user.organizationUuid,
            event: 'user.updated',
        });
        return user;
    }

    async registerInitialUser(createUser: CreateInitialUserArgs) {
        if (await this.userModel.hasUsers()) {
            throw new ForbiddenError('User already registered');
        }
        const user = await this.userModel.createInitialUser(createUser);
        identifyUser({
            ...user,
            isMarketingOptedIn: createUser.isMarketingOptedIn,
        });
        analytics.track({
            event: 'user.created',
            organizationId: user.organizationUuid,
            userId: user.userUuid,
        });
        analytics.track({
            event: 'organization.created',
            userId: user.userUuid,
            organizationId: user.organizationUuid,
            properties: {
                type:
                    lightdashConfig.mode === LightdashMode.CLOUD_BETA
                        ? 'cloud'
                        : 'self-hosted',
                organizationId: user.organizationUuid,
                organizationName: user.organizationName,
            },
        });
        return user;
    }
}
