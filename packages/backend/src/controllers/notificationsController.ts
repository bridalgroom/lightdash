import {
    ApiErrorPayload,
    ApiGetNotifications,
    ApiNotificationUpdateParams,
    ApiSuccessEmpty,
    NotificationResourceType,
} from '@lightdash/common';
import {
    Body,
    Controller,
    Get,
    Middlewares,
    OperationId,
    Patch,
    Path,
    Query,
    Request,
    Response,
    Route,
    SuccessResponse,
    Tags,
} from '@tsoa/runtime';
import express from 'express';
import { notificationsService } from '../services/services';
import { allowApiKeyAuthentication, isAuthenticated } from './authentication';

@Route('/api/v1/notifications')
@Response<ApiErrorPayload>('default', 'Error')
@Tags('Notifications')
export class NotificationsController extends Controller {
    /**
     * Gets notifications for a user based on the type
     * @param req express request
     * @query type the type of notification to get
     * @returns the notifications for a user
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Get('/')
    @OperationId('getNotifications')
    async getNotifications(
        @Request() req: express.Request,
        @Query() type: NotificationResourceType,
    ): Promise<ApiGetNotifications> {
        const results = await notificationsService.getNotifications(
            req.user!.userUuid,
            type,
        );

        this.setStatus(200);
        return {
            status: 'ok',
            results,
        };
    }

    /**
     * Update notification
     * @param req express request
     * @param notificationId the id of the notification
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Patch('{notificationId}')
    @OperationId('updateNotification')
    async updateNotification(
        @Path() notificationId: string,
        @Body() body: ApiNotificationUpdateParams,
    ): Promise<ApiSuccessEmpty> {
        await notificationsService.updateNotification(notificationId, body);

        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }
}
