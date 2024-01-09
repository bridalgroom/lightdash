import { subject } from '@casl/ability';
import {
    ForbiddenError,
    Group,
    GroupMember,
    GroupMembership,
    GroupWithMembers,
    ProjectGroupAccess,
    ProjectMemberRole,
    SessionUser,
    UpdateGroup,
    UpdateGroupWithMembers,
} from '@lightdash/common';
import { CreateDBProjectGroupAccess } from '../database/entities/projectGroupAccess';
import { GroupsModel } from '../models/GroupsModel';

type GroupServiceDependencies = {
    groupsModel: GroupsModel;
};

export class GroupsService {
    private readonly groupsModel: GroupsModel;

    constructor(deps: GroupServiceDependencies) {
        this.groupsModel = deps.groupsModel;
    }

    async addGroupMember(
        actor: SessionUser,
        member: GroupMembership,
    ): Promise<GroupMembership | undefined> {
        const group = await this.groupsModel.getGroup(member.groupUuid);
        if (
            actor.ability.cannot(
                'update',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        return this.groupsModel.addGroupMember(member);
    }

    async removeGroupMember(
        actor: SessionUser,
        member: GroupMembership,
    ): Promise<boolean> {
        const group = await this.groupsModel.getGroup(member.groupUuid);
        if (
            actor.ability.cannot(
                'update',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        return this.groupsModel.removeGroupMember(member);
    }

    async delete(actor: SessionUser, groupUuid: string): Promise<void> {
        const group = await this.groupsModel.getGroup(groupUuid);
        if (
            actor.ability.cannot(
                'delete',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        await this.groupsModel.deleteGroup(groupUuid);
    }

    async get(
        actor: SessionUser,
        groupUuid: string,
        includeMembers?: number,
        offset?: number,
    ): Promise<Group | GroupWithMembers> {
        const group =
            includeMembers === undefined
                ? await this.groupsModel.getGroup(groupUuid)
                : await this.groupsModel.getGroupWithMembers(
                      groupUuid,
                      includeMembers,
                      offset,
                  );

        if (
            actor.ability.cannot(
                'view',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        return group;
    }

    async update(
        actor: SessionUser,
        groupUuid: string,
        update: UpdateGroupWithMembers,
    ): Promise<Group | GroupWithMembers> {
        const group = await this.groupsModel.getGroup(groupUuid);
        if (
            actor.ability.cannot(
                'update',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        const newGroup = await this.groupsModel.updateGroup(groupUuid, update);
        return newGroup;
    }

    async getGroupMembers(
        actor: SessionUser,
        groupUuid: string,
    ): Promise<GroupMember[]> {
        const group = await this.groupsModel.getGroupWithMembers(groupUuid);
        if (
            actor.ability.cannot(
                'view',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        return group.members;
    }

    async addProjectAccess(
        actor: SessionUser,
        { groupUuid, projectUuid, role }: ProjectGroupAccess,
    ): Promise<ProjectGroupAccess> {
        const group = await this.groupsModel.getGroup(groupUuid);

        if (
            actor.ability.cannot(
                'update',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        const groupProjectAccess = await this.groupsModel.addProjectAccess({
            groupUuid,
            projectUuid,
            role,
        });

        return {
            projectUuid,
            groupUuid: groupProjectAccess.group_uuid,
            role: groupProjectAccess.role,
        };
    }

    async removeProjectAccess(
        actor: SessionUser,
        {
            groupUuid,
            projectUuid,
        }: Pick<ProjectGroupAccess, 'groupUuid' | 'projectUuid'>,
    ) {
        const group = await this.groupsModel.getGroup(groupUuid);
        if (
            actor.ability.cannot(
                'update',
                subject('Group', {
                    organizationUuid: group.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        const removed = await this.groupsModel.removeProjectAccess({
            groupUuid,
            projectUuid,
        });

        return removed;
    }
}
