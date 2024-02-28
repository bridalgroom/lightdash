import {
    ApiNotificationResourceType,
    ApiNotificationUpdateParams,
    Dashboard,
    DashboardTile,
    LightdashUser,
    NotificationDashboardComment,
} from '@lightdash/common';
import { Knex } from 'knex';
import { DbDashboardTileComments } from '../../database/entities/comments';
import {
    DbNotificationResourceType,
    NotificationsTableName,
} from '../../database/entities/notifications';

type NotificationsModelDependencies = {
    database: Knex;
};

export class NotificationsModel {
    private readonly database: Knex;

    constructor(deps: NotificationsModelDependencies) {
        this.database = deps.database;
    }

    async getDashboardCommentNotifications(
        userUuid: string,
    ): Promise<NotificationDashboardComment[]> {
        const notifications = await this.database(NotificationsTableName)
            .select(`*`)
            .where(`${NotificationsTableName}.user_uuid`, userUuid)
            .andWhere(
                `${NotificationsTableName}.resource_type`,
                DbNotificationResourceType.DashboardComments,
            )
            .orderBy(`${NotificationsTableName}.created_at`, 'desc');

        return notifications.map((notif) => ({
            notificationId: notif.notification_id,
            resourceType: ApiNotificationResourceType.DashboardComments,
            message: notif.message ?? undefined,
            url: notif.url ?? undefined,
            viewed: notif.viewed,
            createdAt: notif.created_at,
            resourceUuid: notif.resource_uuid ?? undefined,
            metadata: notif.metadata
                ? {
                      dashboardUuid: notif.metadata.dashboard_uuid,
                      dashboardName: notif.metadata.dashboard_name,
                      dashboardTileUuid: notif.metadata.dashboard_tile_uuid,
                      dashboardTileName: notif.metadata.dashboard_tile_name,
                  }
                : undefined,
        }));
    }

    async updateNotification(
        notificationUuid: string,
        updateData: ApiNotificationUpdateParams,
    ) {
        return this.database(NotificationsTableName)
            .where({ notification_id: notificationUuid })
            .update(updateData);
    }

    async createDashboardCommentNotification(
        userUuid: string,
        commentAuthor: LightdashUser,
        comment: DbDashboardTileComments,
        dashboard: Dashboard,
        dashboardTile: DashboardTile | undefined,
    ) {
        if (comment.mentions.length > 0 && dashboardTile) {
            await Promise.all(
                comment.mentions.map(async (mentionUserUuid) => {
                    if (mentionUserUuid !== userUuid) {
                        await this.database(NotificationsTableName).insert({
                            user_uuid: mentionUserUuid,
                            resource_uuid: comment.comment_id,
                            resource_type:
                                DbNotificationResourceType.DashboardComments,
                            message: `You were mentioned in a comment by ${
                                commentAuthor.firstName
                            } ${commentAuthor.lastName} on the dashboard ${
                                dashboard.name
                            } ${
                                dashboardTile.properties.title
                                    ? `in tile "${dashboardTile.properties.title}"`
                                    : ''
                            }`,
                            url: `/dashboards/${dashboard.uuid}`,
                            metadata: JSON.stringify({
                                dashboard_uuid: dashboard.uuid,
                                dashboard_name: dashboard.name,
                                dashboard_tile_uuid: dashboardTile.uuid,
                                dashboard_tile_name:
                                    dashboardTile.properties.title ?? '',
                            }),
                        });
                    }
                }),
            );
        }
    }
}
