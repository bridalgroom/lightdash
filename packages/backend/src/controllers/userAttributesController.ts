import {
    ApiCreateUserAttributeResponse,
    ApiErrorPayload,
    ApiSuccessEmpty,
    ApiUserAttributesResponse,
    CreateUserAttribute,
    getRequestMethod,
    LightdashRequestMethodHeader,
} from '@lightdash/common';
import { Controller, Delete, Post, Put } from '@tsoa/runtime';
import express from 'express';
import {
    Body,
    Get,
    Middlewares,
    OperationId,
    Path,
    Request,
    Response,
    Route,
    Tags,
} from 'tsoa';
import { userAttributesService } from '../services/services';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from './authentication';

@Route('/api/v1/org/attributes')
@Response<ApiErrorPayload>('default', 'Error')
@Tags('User attributes')
export class UserAttributesController extends Controller {
    /**
     * Get all user attributes
     * @param req
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('/')
    @OperationId('getUserAttributes')
    async getUserAttributes(
        @Request() req: express.Request,
    ): Promise<ApiUserAttributesResponse> {
        this.setStatus(200);
        const context = getRequestMethod(
            req.header(LightdashRequestMethodHeader),
        );
        return {
            status: 'ok',
            results: await userAttributesService.getAll(req.user!, context),
        };
    }

    /**
     * Creates new user attribute
     * @param body the user attribute to create
     * @param req
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Post('/')
    @OperationId('createUserAttribute')
    async createUserAttribute(
        @Request() req: express.Request,
        @Body() body: CreateUserAttribute,
    ): Promise<ApiCreateUserAttributeResponse> {
        this.setStatus(201);

        return {
            status: 'ok',
            results: await userAttributesService.create(req.user!, body),
        };
    }

    /**
     * Updates a user attribute
     * @param userAttributeUuid the UUID for the group to add the user to
     * @param body the user attribute to update
     * @param req
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Put('{userAttributeUuid}')
    @OperationId('updateUserAttribute')
    async updateUserAttribute(
        @Path() userAttributeUuid: string,
        @Request() req: express.Request,
        @Body() body: CreateUserAttribute,
    ): Promise<ApiCreateUserAttributeResponse> {
        this.setStatus(201);

        return {
            status: 'ok',
            results: await userAttributesService.update(
                req.user!,
                userAttributeUuid,
                body,
            ),
        };
    }

    /**
     * Remove a user attribute
     * @param userAttributeUuid the user attribute UUID to remove
     * @param req
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Delete('{userAttributeUuid}')
    @OperationId('removeUserAttribute')
    async removeUserAttribute(
        @Path() userAttributeUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        this.setStatus(200);

        await userAttributesService.delete(req.user!, userAttributeUuid);
        return {
            status: 'ok',
            results: undefined,
        };
    }
}
