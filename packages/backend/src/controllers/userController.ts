import {
    ApiEmailStatusResponse,
    ApiErrorPayload,
    ApiGetAuthenticatedUserResponse,
    ApiRegisterUserResponse,
    ApiSuccessEmpty,
    ApiUserAllowedOrganizationsResponse,
    ParameterError,
    RegisterOrActivateUser,
    validatePassword,
} from '@lightdash/common';
import {
    Body,
    Controller,
    Delete,
    Get,
    Middlewares,
    OperationId,
    Path,
    Post,
    Put,
    Query,
    Request,
    Response,
    Route,
    Tags,
} from '@tsoa/runtime';
import express from 'express';
import { userModel } from '../models/models';
import { UserModel } from '../models/UserModel';
import { userService } from '../services/services';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from './authentication';

@Route('/api/v1/user')
@Response<ApiErrorPayload>('default', 'Error')
@Tags('My Account')
export class UserController extends Controller {
    /**
     * Get authenticated user
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('/')
    @OperationId('GetAuthenticatedUser')
    async getAuthenticatedUser(
        @Request() req: express.Request,
    ): Promise<ApiGetAuthenticatedUserResponse> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: UserModel.lightdashUserFromSession(req.user!),
        };
    }

    /**
     * Register user
     * @param req express request
     * @param body
     */
    @Middlewares([unauthorisedInDemo])
    @Post('/')
    @OperationId('RegisterUser')
    async registerUser(
        @Request() req: express.Request,
        @Body()
        body: RegisterOrActivateUser,
    ): Promise<ApiRegisterUserResponse> {
        if (!validatePassword(req.body.password)) {
            throw new ParameterError(
                'Password must contain at least 8 characters, 1 letter and 1 number or 1 special character',
            );
        }
        const sessionUser = await userService.registerOrActivateUser(body);
        return new Promise((resolve, reject) => {
            req.login(sessionUser, (err) => {
                if (err) {
                    reject(err);
                }
                this.setStatus(200);
                resolve({
                    status: 'ok',
                    results: sessionUser,
                });
            });
        });
    }

    /**
     * Create a new one-time passcode for the current user's primary email.
     * The user will receive an email with the passcode.
     * @param req express request
     */
    @Middlewares([isAuthenticated, unauthorisedInDemo])
    @Put('/me/email/otp')
    @OperationId('CreateEmailOneTimePasscode')
    async createEmailOneTimePasscode(
        @Request() req: express.Request,
    ): Promise<ApiEmailStatusResponse> {
        const status = await userService.sendOneTimePasscodeToPrimaryEmail(
            req.user!,
        );
        this.setStatus(200);
        return {
            status: 'ok',
            results: status,
        };
    }

    /**
     * Get the verification status for the current user's primary email
     * @param req express request
     * @param passcode the one-time passcode sent to the user's primary email
     */
    @Middlewares([isAuthenticated])
    @Get('/me/email/status')
    @OperationId('GetEmailVerificationStatus')
    async getEmailVerificationStatus(
        @Request() req: express.Request,
        @Query() passcode?: string,
    ): Promise<ApiEmailStatusResponse> {
        // Throws 404 error if not found
        const status = await userService.getPrimaryEmailStatus(
            req.user!,
            passcode,
        );
        this.setStatus(200);
        return {
            status: 'ok',
            results: status,
        };
    }

    /**
     * List the organizations that the current user can join.
     * This is based on the user's primary email domain and the organization's allowed email domains.
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('/me/allowedOrganizations')
    @OperationId('ListMyAvailableOrganizations')
    async getOrganizationsUserCanJoin(
        @Request() req: express.Request,
    ): Promise<ApiUserAllowedOrganizationsResponse> {
        const status = await userService.getAllowedOrganizations(req.user!);
        this.setStatus(200);
        return {
            status: 'ok',
            results: status,
        };
    }

    /**
     * Add the current user to an organization that accepts users with a verified email domain.
     * This will fail if the organization email domain does not match the user's primary email domain.
     * @param req express request
     * @param organizationUuid the uuid of the organization to join
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Post('/me/joinOrganization/{organizationUuid}')
    @OperationId('JoinOrganization')
    async joinOrganization(
        @Request() req: express.Request,
        @Path() organizationUuid: string,
    ): Promise<ApiSuccessEmpty> {
        await userService.joinOrg(req.user!, organizationUuid);
        const sessionUser = await userModel.findSessionUserByUUID(
            req.user!.userUuid,
        );
        await new Promise<void>((resolve, reject) => {
            req.login(sessionUser, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Delete user
     * @param req express request
     */
    @Middlewares([isAuthenticated])
    @Delete('/me')
    @OperationId('DeleteMe')
    async deleteUser(
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        await userService.delete(req.user!, req.user!.userUuid);
        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }
}