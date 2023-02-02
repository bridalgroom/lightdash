import {
    ApiErrorPayload,
    ApiSchedulerAndTargetsResponse,
    UpdateSchedulerAndTargetsWithoutId,
} from '@lightdash/common';
import { Delete } from '@tsoa/runtime';
import express from 'express';
import {
    Body,
    Controller,
    Middlewares,
    OperationId,
    Patch,
    Path,
    Request,
    Response,
    Route,
    SuccessResponse,
} from 'tsoa';
import { schedulerService } from '../services/services';
import { allowApiKeyAuthentication, isAuthenticated } from './authentication';

@Route('/api/v1/schedulers')
@Response<ApiErrorPayload>('default', 'Error')
export class SchedulerController extends Controller {
    /**
     * Update a scheduler
     * @param schedulerUuid The uuid of the scheduler to update
     * @param req express request
     * @param body the new scheduler data
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('201', 'Updated')
    @Patch('{schedulerUuid}')
    @OperationId('updateScheduler')
    async patch(
        @Path() schedulerUuid: string,
        @Request() req: express.Request,
        @Body() body: any, // TODO: It should be UpdateSchedulerAndTargetsWithoutId but tsoa returns an error
    ): Promise<ApiSchedulerAndTargetsResponse> {
        this.setStatus(201);
        return {
            status: 'ok',
            results: await schedulerService.updateScheduler(
                req.user!,
                schedulerUuid,
                body,
            ),
        };
    }

    /**
     * Delete a scheduler
     * @param schedulerUuid The uuid of the scheduler to delete
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('201', 'Deleted')
    @Delete('{schedulerUuid}')
    @OperationId('deleteScheduler')
    async delete(
        @Path() schedulerUuid: string,
        @Request() req: express.Request,
    ): Promise<{
        status: 'ok';
        results: undefined;
    }> {
        this.setStatus(201);
        await schedulerService.deleteScheduler(req.user!, schedulerUuid);
        return {
            status: 'ok',
            results: undefined,
        };
    }
}
