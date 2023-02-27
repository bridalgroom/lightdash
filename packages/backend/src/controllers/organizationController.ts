import {
    ApiErrorPayload,
    ApiOrganization,
    ApiOrganizationMemberProfile,
    ApiOrganizationMemberProfiles,
    ApiSuccessEmpty,
    OrganizationMemberProfileUpdate,
    UpdateOrganization,
} from '@lightdash/common';
import { Controller, Delete } from '@tsoa/runtime';
import express from 'express';
import {
    Body,
    Get,
    Middlewares,
    OperationId,
    Patch,
    Path,
    Request,
    Response,
    Route,
} from 'tsoa';
import { promisify } from 'util';
import { organizationService } from '../services/services';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from './authentication';

@Route('/api/v1/org')
@Response<ApiErrorPayload>('default', 'Error')
export class OrganizationController extends Controller {
    /**
     * Get the current user's organization
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get()
    @OperationId('getOrganization')
    async getOrganization(
        @Request() req: express.Request,
    ): Promise<ApiOrganization> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await organizationService.get(req.user!),
        };
    }

    /**
     * Update the current user's organization
     * @param req express request
     * @param body the new organization settings
     */
    @Middlewares([isAuthenticated, unauthorisedInDemo])
    @Patch()
    @OperationId('updateOrganization')
    async updateOrganization(
        @Request() req: express.Request,
        @Body() body: UpdateOrganization,
    ): Promise<ApiSuccessEmpty> {
        await organizationService.updateOrg(req.user!, body);
        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Delete an organization and all users inside that organization
     * @param req express request
     * @param organizationUuid the uuid of the organization to delete
     */
    @Middlewares([isAuthenticated, unauthorisedInDemo])
    @Delete('{organizationUuid}')
    @OperationId('deleteOrganization')
    async deleteOrganization(
        @Request() req: express.Request,
        @Path() organizationUuid: string,
    ): Promise<ApiSuccessEmpty> {
        await organizationService.delete(organizationUuid, req.user!);
        await promisify(req.session.destroy)();
        this.setStatus(200);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Gets all the members of the current user's organization
     * @param req express request
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('/users')
    @OperationId('getOrganizationMembers')
    async getOrganizationMembers(
        @Request() req: express.Request,
    ): Promise<ApiOrganizationMemberProfiles> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await organizationService.getUsers(req.user!),
        };
    }

    /**
     * Updates the membership profile for a user in the current user's organization
     * @param req express request
     * @param userUuid the uuid of the user to update
     * @param body the new membership profile
     */
    @Middlewares([isAuthenticated, unauthorisedInDemo])
    @Patch('/users/{userUuid}')
    @OperationId('updateOrganizationMember')
    async updateOrganizationMember(
        @Request() req: express.Request,
        @Path() userUuid: string,
        @Body() body: OrganizationMemberProfileUpdate,
    ): Promise<ApiOrganizationMemberProfile> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await organizationService.updateMember(
                req.user!,
                userUuid,
                body,
            ),
        };
    }
}
