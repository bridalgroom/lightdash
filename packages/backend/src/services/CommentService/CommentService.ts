import { subject } from '@casl/ability';
import {
    Comment,
    Dashboard,
    DashboardTile,
    ForbiddenError,
    LightdashUser,
    SessionUser,
    SpaceSummary,
} from '@lightdash/common';
import * as Sentry from '@sentry/node';
import { LightdashAnalytics } from '../../analytics/LightdashAnalytics';
import { CommentModel } from '../../models/CommentModel/CommentModel';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { NotificationsModel } from '../../models/NotificationsModel/NotificationsModel';
import { SpaceModel } from '../../models/SpaceModel';
import { UserModel } from '../../models/UserModel';
import { hasSpaceAccess } from '../SpaceService/SpaceService';

type CommentServiceArguments = {
    analytics: LightdashAnalytics;
    dashboardModel: DashboardModel;
    spaceModel: SpaceModel;
    commentModel: CommentModel;
    notificationsModel: NotificationsModel;
    userModel: UserModel;
};

export class CommentService {
    analytics: LightdashAnalytics;

    dashboardModel: DashboardModel;

    spaceModel: SpaceModel;

    commentModel: CommentModel;

    notificationsModel: NotificationsModel;

    userModel: UserModel;

    constructor({
        analytics,
        dashboardModel,
        spaceModel,
        commentModel,
        notificationsModel,
        userModel,
    }: CommentServiceArguments) {
        this.analytics = analytics;
        this.dashboardModel = dashboardModel;
        this.spaceModel = spaceModel;
        this.commentModel = commentModel;
        this.notificationsModel = notificationsModel;
        this.userModel = userModel;
    }

    async hasDashboardSpaceAccess(
        user: SessionUser,
        spaceUuid: string,
    ): Promise<boolean> {
        let space: SpaceSummary;

        try {
            space = await this.spaceModel.getSpaceSummary(spaceUuid);
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
            return false;
        }

        return hasSpaceAccess(user, space);
    }

    private async createCommentNotification({
        userUuid,
        comment,
        dashboard,
        dashboardTileUuid,
    }: {
        userUuid: string;
        comment: Comment;
        dashboard: Dashboard;
        dashboardTileUuid: string;
    }) {
        const usersThatCommentedInTile =
            await this.commentModel.findUsersThatCommentedInDashboardTile(
                dashboard.uuid,
                dashboardTileUuid,
            );

        const taggedUsersToNotify = comment.mentions.map((mention) => ({
            userUuid: mention,
            tagged: true,
        }));

        const usersThatCommentedToNotify = usersThatCommentedInTile
            .filter((u) =>
                taggedUsersToNotify.some((t) => t.userUuid === u.userUuid),
            )
            .map((user) => ({
                userUuid: user.userUuid,
                tagged: false,
            }));

        if (
            taggedUsersToNotify.length === 0 &&
            usersThatCommentedToNotify.length === 0
        )
            return;

        const dashboardTile = dashboard.tiles.find(
            (t) => t.uuid === dashboardTileUuid,
        );

        const commentAuthor = await this.userModel.getUserDetailsByUuid(
            userUuid,
        );

        await this.notificationsModel.createDashboardCommentNotification({
            userUuid,
            commentAuthor,
            comment,
            usersToNotify: [
                ...taggedUsersToNotify,
                ...usersThatCommentedToNotify,
            ],
            dashboard,
            dashboardTile,
        });
    }

    async createComment(
        user: SessionUser,
        dashboardUuid: string,
        dashboardTileUuid: string,
        text: string,
        textHtml: string,
        replyTo: string | null,
        mentions: string[],
    ): Promise<string> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);

        if (
            user.ability.cannot(
                'create',
                subject('DashboardComments', {
                    projectUuid: dashboard.projectUuid,
                    organizationUuid: user.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        if (!(await this.hasDashboardSpaceAccess(user, dashboard.spaceUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }
        this.analytics.track({
            event: 'comment.created',
            userId: user.userUuid,
            properties: {
                dashboardUuid,
                dashboardTileUuid,
                isReply: !!replyTo,
                hasMention: mentions.length > 0,
            },
        });

        const comment = await this.commentModel.createComment(
            dashboardUuid,
            dashboardTileUuid,
            text,
            textHtml,
            replyTo,
            user,
            mentions,
        );

        if (!comment) {
            throw new Error('Failed to create comment');
        }

        // Intentionally not awaiting this promise to avoid slowing down the response
        this.createCommentNotification({
            userUuid: user.userUuid,
            comment,
            dashboard,
            dashboardTileUuid,
        });

        return comment.commentId;
    }

    async findCommentsForDashboard(
        user: SessionUser,
        dashboardUuid: string,
    ): Promise<Record<string, Comment[]>> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);

        if (
            user.ability.cannot(
                'view',
                subject('DashboardComments', {
                    organizationUuid: dashboard.organizationUuid,
                    projectUuid: dashboard.projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        if (!(await this.hasDashboardSpaceAccess(user, dashboard.spaceUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        const canUserRemoveAnyComment = user.ability.can(
            'manage',
            subject('DashboardComments', {
                organizationUuid: dashboard.organizationUuid,
                projectUuid: dashboard.projectUuid,
            }),
        );

        return this.commentModel.findCommentsForDashboard(
            dashboardUuid,
            user.userUuid,
            canUserRemoveAnyComment,
        );
    }

    async resolveComment(
        user: SessionUser,
        dashboardUuid: string,
        commentId: string,
    ): Promise<void> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);
        if (
            user.ability.cannot(
                'manage',
                subject('DashboardComments', {
                    organizationUuid: dashboard.organizationUuid,
                    projectUuid: dashboard.projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        if (!(await this.hasDashboardSpaceAccess(user, dashboard.spaceUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        const comment = await this.commentModel.getComment(commentId);

        this.analytics.track({
            event: 'comment.resolved',
            userId: user.userUuid,
            properties: {
                isReply: !!comment.replyTo,
                dashboardTileUuid: comment.dashboardTileUuid,
                dashboardUuid,
                isOwner: comment.userUuid === user.userUuid,
                hasMention: comment.mentions.length > 0,
            },
        });

        return this.commentModel.resolveComment(commentId);
    }

    async deleteComment(
        user: SessionUser,
        dashboardUuid: string,
        commentId: string,
    ): Promise<void> {
        const dashboard = await this.dashboardModel.getById(dashboardUuid);

        if (!(await this.hasDashboardSpaceAccess(user, dashboard.spaceUuid))) {
            throw new ForbiddenError(
                "You don't have access to the space this dashboard belongs to",
            );
        }

        const canRemoveAnyComment = user.ability.can(
            'manage',
            subject('DashboardComments', {
                organizationUuid: dashboard.organizationUuid,
                projectUuid: dashboard.projectUuid,
            }),
        );

        const comment = await this.commentModel.getComment(commentId);

        if (canRemoveAnyComment) {
            await this.commentModel.deleteComment(commentId);
        } else {
            const isOwner = comment.userUuid === user.userUuid;

            if (isOwner) {
                await this.commentModel.deleteComment(commentId);
            }

            throw new ForbiddenError();
        }

        this.analytics.track({
            event: 'comment.deleted',
            userId: user.userUuid,
            properties: {
                isReply: !!comment.replyTo,
                dashboardTileUuid: comment.dashboardTileUuid,
                dashboardUuid,
                isOwner: comment.userUuid === user.userUuid,
                hasMention: comment.mentions.length > 0,
            },
        });
    }
}
