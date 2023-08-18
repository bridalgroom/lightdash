import {
    ApiErrorPayload,
    ApiGdriveAccessTokenResponse,
    ApiJobScheduledResponse,
    UploadMetricGsheet,
} from '@lightdash/common';
import express from 'express';
import {
    Body,
    Controller,
    Get,
    Middlewares,
    OperationId,
    Post,
    Request,
    Response,
    Route,
    SuccessResponse,
    Tags,
} from 'tsoa';
import { GdriveService } from '../services/GdriveService/GdriveService';
import { userService } from '../services/services';
import { allowApiKeyAuthentication, isAuthenticated } from './authentication';

@Route('/api/v1/gdrive')
@Response<ApiErrorPayload>('default', 'Error')
@Tags('Integrations')
export class GoogleDriveController extends Controller {
    /**
     * Get access token for google drive
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Get('/get-access-token')
    @OperationId('getAccessToken')
    async get(
        @Request() req: express.Request,
    ): Promise<ApiGdriveAccessTokenResponse> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await userService.getAccessToken(req.user!),
        };
    }

    /**
     * Upload results from query to Google Sheet
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Post('/upload-gsheet')
    @OperationId('uploadGsheet')
    async post(
        @Body() body: UploadMetricGsheet,
        @Request() req: express.Request,
    ): Promise<ApiJobScheduledResponse> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await GdriveService.scheduleUploadGsheet(req.user!, body),
        };
    }
}
