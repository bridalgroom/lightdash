import {
    ApiErrorPayload,
    ApiGroupMembersResponse,
    ApiGroupResponse,
    ApiSuccessEmpty,
    UpdateGroup,
} from '@lightdash/common';
import { Controller, Delete, Put } from '@tsoa/runtime';
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
import { groupService } from '../services/services';
import {
    allowApiKeyAuthentication,
    isAuthenticated,
    unauthorisedInDemo,
} from './authentication';

@Route('/api/v1/groups')
@Response<ApiErrorPayload>('default', 'Error')
export class GroupsController extends Controller {
    /**
     * Get group details including a list of members
     * @param groupUuid unique id of the group
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('{groupUuid}')
    @OperationId('getGroup')
    async getGroup(
        @Path() groupUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiGroupResponse> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await groupService.get(req.user!, groupUuid),
        };
    }

    /**
     * Delete a group
     * @param unique id of the group to delete
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Delete('{groupUuid}')
    @OperationId('deleteGroup')
    async deleteGroup(
        @Path() groupUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        this.setStatus(200);
        await groupService.delete(req.user!, groupUuid);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Add a Lightdash user to a group
     * @param groupUuid the UUID for the group to add the user to
     * @param userUuid the UUID for the user to add to the group
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Put('{groupUuid}/members/{userUuid}')
    @OperationId('addUserToGroup')
    async addUserToGroup(
        @Path() groupUuid: string,
        @Path() userUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        const createdMember = await groupService.addGroupMember(req.user!, {
            groupUuid,
            userUuid,
        });
        this.setStatus(createdMember === undefined ? 204 : 201);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * Remove a user from a group
     * @param groupUuid the UUID for the group to remove the user from
     * @param userUuid the UUID for the user to remove from the group
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Delete('{groupUuid}/members/{userUuid}')
    @OperationId('removeUserFromGroup')
    async removeUserFromGroup(
        @Path() groupUuid: string,
        @Path() userUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiSuccessEmpty> {
        const deleted = await groupService.removeGroupMember(req.user!, {
            userUuid,
            groupUuid,
        });
        this.setStatus(deleted ? 200 : 204);
        return {
            status: 'ok',
            results: undefined,
        };
    }

    /**
     * View members of a group
     * @param groupUuid the UUID for the group to view the members of
     */
    @Middlewares([allowApiKeyAuthentication, isAuthenticated])
    @Get('{groupUuid}/members')
    @OperationId('getGroupMembers')
    async getGroupMembers(
        @Path() groupUuid: string,
        @Request() req: express.Request,
    ): Promise<ApiGroupMembersResponse> {
        this.setStatus(200);
        return {
            status: 'ok',
            results: await groupService.getGroupMembers(req.user!, groupUuid),
        };
    }

    /**
     * Update a group
     */
    @Middlewares([
        allowApiKeyAuthentication,
        isAuthenticated,
        unauthorisedInDemo,
    ])
    @Patch('{groupUuid}')
    @OperationId('updateGroup')
    async updateGroup(
        @Path() groupUuid: string,
        @Request() req: express.Request,
        @Body() body: UpdateGroup,
    ): Promise<ApiGroupResponse> {
        const group = await groupService.update(req.user!, groupUuid, body);
        this.setStatus(200);
        return {
            status: 'ok',
            results: group,
        };
    }
}
