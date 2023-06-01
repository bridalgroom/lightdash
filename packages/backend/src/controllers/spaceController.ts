import {
    ApiErrorPayload,
    ApiSpaceResponse,
    ApiSuccessEmpty,
    CreateSpace,
    UpdateSpace,
} from '@lightdash/common';
import express from 'express';
import {
    Body,
    Controller,
    Delete,
    Get,
    Middlewares,
    OperationId,
    Patch,
    Path,
    Post,
    Request,
    Response,
    Route,
    SuccessResponse,
    Tags,
} from 'tsoa';
import { spaceService } from '../services/services';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from './authentication';

@Route('/api/v1/projects/{projectUuid}/spaces')
@Response<ApiErrorPayload>('default', 'Error')
@Tags('Spaces')
export class SpaceController extends Controller {
    /**
     * Get details for a space in a project
     * @param projectUuid The uuid of the space's parent project
     * @param spaceUuid The uuid of the space to get
     * @param req
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @SuccessResponse('200', 'Success')
    @Get('{spaceUuid}')
    @OperationId('GetSpace')
    async getSpace(
        @Path() projectUuid: string,
        @Path() spaceUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiSpaceResponse> {
        this.setStatus(200);
        const results = await spaceService.getSpace(
            projectUuid,
            req.user!,
            spaceUuid,
        );
        return {
            status: 'ok',
            results,
        };
    }

    /**
     * Create a new space inside a project
     * @param projectUuid The uuid of the space's parent project
     * @param body
     * @param req
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @SuccessResponse('201', 'Created')
    @Post('/')
    @OperationId('CreateSpaceInProject')
    @Tags('Roles & Permissions')
    async createSpace(
        @Path() projectUuid: string,
        @Body() body: CreateSpace,
        @Request() req: express.Request,
    ): Promise<ApiSpaceResponse> {
        this.setStatus(201);
        const results = await spaceService.createSpace(
            projectUuid,
            req.user!,
            body,
        );
        return {
            status: 'ok',
            results,
        };
    }

    /**
     * Delete a space from a project
     * @param projectUuid The uuid of the space's parent project
     * @param spaceUuid The uuid of the space to delete
     * @param req
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @SuccessResponse('204', 'Deleted')
    @Delete('{spaceUuid}')
    @OperationId('DeleteSpace')
    async deleteSpace(
        @Path() projectUuid: string,
        @Path() spaceUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        this.setStatus(204);
        await spaceService.deleteSpace(req.user!, spaceUuid);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Update a space in a project
     * @param projectUuid The uuid of the space's parent project
     * @param spaceUuid The uuid of the space to update
     * @param body
     * @param req
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @SuccessResponse('200', 'Updated')
    @Patch('{spaceUuid}')
    @OperationId('UpdateSpace')
    @Tags('Roles & Permissions')
    async updateSpace(
        @Path() projectUuid: string,
        @Path() spaceUuid: string,
        @Body() body: UpdateSpace,
        @Request() req: express.Request,
    ): Promise<ApiSpaceResponse> {
        this.setStatus(200);
        const results = await spaceService.updateSpace(
            req.user!,
            spaceUuid,
            body,
        );
        return {
            status: 'ok',
            results,
        };
    }
}
