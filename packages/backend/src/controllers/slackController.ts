import {
    ApiErrorPayload,
    ApiSlackChannelsResponse,
    ApiSlackNotificationChannelResponse,
    ForbiddenError,
} from '@lightdash/common';
import {
    Body,
    Controller,
    Get,
    Middlewares,
    OperationId,
    Put,
    Request,
    Response,
    Route,
    SuccessResponse,
    Tags,
} from '@tsoa/runtime';
import express from 'express';
import { slackClient } from '../clients/clients';
import { allowApiKeyAuthentication, isAuthenticated } from './authentication';

@Route('/api/v1/slack')
@Response<ApiErrorPayload>('default', 'Error')
@Tags('Integrations')
export class SlackController extends Controller {
    /**
     * Get slack channels
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Get('/channels')
    @OperationId('getSlackChannels')
    async get(
        @Request() req: express.Request,
    ): Promise<ApiSlackChannelsResponse> {
        this.setStatus(200);
        const organizationUuid = req.user?.organizationUuid;
        if (!organizationUuid) throw new ForbiddenError();
        return {
            status: 'ok',
            results: await slackClient.getChannels(organizationUuid),
        };
    }

    /**
     * Update slack notification channel to send notifications to scheduled jobs fail
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Put('/notification-channel')
    @OperationId('UpdateNotificationChannel')
    async updateNotificationChannel(
        @Request() req: express.Request,
        @Body() body: { channelId: string },
    ): Promise<ApiSlackNotificationChannelResponse> {
        this.setStatus(200);
        const organizationUuid = req.user?.organizationUuid;
        if (!organizationUuid) throw new ForbiddenError();
        return {
            status: 'ok',
            results: await slackClient.updateNotificationChannel(
                organizationUuid,
                body.channelId,
            ),
        };
    }
}
