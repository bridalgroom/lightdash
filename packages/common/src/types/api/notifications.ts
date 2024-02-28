export enum NotificationResourceType {
    DashboardComments = 'dashboard_comments',
}

interface NotificationDashboardTileCommentMetadata {
    dashboardUuid: string;
    dashboardName: string;
    dashboardTileUuid: string;
    dashboardTileName: string;
}

export type NotificationBase = {
    notificationId: string;
    createdAt: Date;
    viewed: boolean;
    resourceUuid: string | undefined;
    message: string | undefined;
    url: string | undefined;
};

export type NotificationDashboardComment = NotificationBase & {
    resourceType: NotificationResourceType.DashboardComments;
    metadata: NotificationDashboardTileCommentMetadata | undefined;
};

export type Notification = NotificationDashboardComment;

export type ApiNotificationUpdateParams = Pick<Notification, 'viewed'>;
export type ApiNotificationsResults = Notification[];

export type ApiGetNotifications = {
    status: 'ok';
    results: ApiNotificationsResults;
};
