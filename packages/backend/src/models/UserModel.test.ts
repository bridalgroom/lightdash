import { subject } from '@casl/ability';
import {
    OrganizationMemberProfile,
    OrganizationMemberRole,
} from '@lightdash/common';
import {
    ProjectMemberProfile,
    ProjectMemberRole,
} from '@lightdash/common/src/types/projectMemberProfile';
import { UserModel } from './UserModel';

const orgProfile: OrganizationMemberProfile = {
    userUuid: 'user-uuid-1234',
    role: OrganizationMemberRole.VIEWER,
    email: '',
    firstName: '',
    lastName: '',
    organizationUuid: 'organization-uuid-1234',
    isActive: true,
};
const projectProfile: ProjectMemberProfile = {
    userUuid: 'user-uuid-1234',
    role: ProjectMemberRole.VIEWER,
    projectUuid: 'project-uuid-1234',
};

describe('Project member permissions', () => {
    let ability = UserModel.mergeUserAbilities(orgProfile, [projectProfile]);
    let conditions = {
        organizationUuid: orgProfile.organizationUuid,
        projectUuid: projectProfile.projectUuid,
    };
    describe('when user is an org viewer and project viewer', () => {
        beforeEach(() => {
            ability = UserModel.mergeUserAbilities(orgProfile, [
                projectProfile,
            ]);
            conditions = {
                organizationUuid: orgProfile.organizationUuid,
                projectUuid: projectProfile.projectUuid,
            };
        });

        it('can view org and project', async () => {
            expect(
                ability.can('view', subject('SavedChart', { ...conditions })),
            ).toEqual(true);
            expect(
                ability.can('view', subject('Dashboard', { ...conditions })),
            ).toEqual(true);
            expect(
                ability.can('view', subject('Project', { ...conditions })),
            ).toEqual(true);
        });

        it('cannot view another org and or another project', async () => {
            conditions = {
                organizationUuid: 'another-org',
                projectUuid: 'another-project',
            };
            expect(
                ability.can('view', subject('SavedChart', { ...conditions })),
            ).toEqual(false);
            expect(
                ability.can('view', subject('Dashboard', { ...conditions })),
            ).toEqual(false);
            expect(
                ability.can('view', subject('Project', { ...conditions })),
            ).toEqual(false);
        });
        it('cannot manage org or project', async () => {
            expect(
                ability.can('manage', subject('SavedChart', { ...conditions })),
            ).toEqual(false);
            expect(
                ability.can('manage', subject('Dashboard', { ...conditions })),
            ).toEqual(false);
            expect(
                ability.can('manage', subject('Project', { ...conditions })),
            ).toEqual(false);
        });
    });

    describe('when user is an org admin and project viewer', () => {
        // org admins and editors have `manage` permissions over all projects
        // within the org
        beforeEach(() => {
            const adminOrgProfile = {
                ...orgProfile,
                role: OrganizationMemberRole.ADMIN,
            };
            ability = UserModel.mergeUserAbilities(adminOrgProfile, [
                projectProfile,
            ]);
            conditions = {
                organizationUuid: orgProfile.organizationUuid,
                projectUuid: projectProfile.projectUuid,
            };
        });

        it('can view org and project', async () => {
            expect(
                ability.can('view', subject('SavedChart', { ...conditions })),
            ).toEqual(true);
            expect(
                ability.can('view', subject('Dashboard', { ...conditions })),
            ).toEqual(true);
            expect(
                ability.can('view', subject('Project', { ...conditions })),
            ).toEqual(true);
        });

        it('cannot view another org and or another project', async () => {
            conditions = {
                organizationUuid: 'another-org',
                projectUuid: 'another-project',
            };
            expect(
                ability.can('view', subject('SavedChart', { ...conditions })),
            ).toEqual(false);
            expect(
                ability.can('view', subject('Dashboard', { ...conditions })),
            ).toEqual(false);
            expect(
                ability.can('view', subject('Project', { ...conditions })),
            ).toEqual(false);
        });
        it('can manage org AND project', async () => {
            expect(
                ability.can('manage', subject('SavedChart', { ...conditions })),
            ).toEqual(true);
            expect(
                ability.can('manage', subject('Dashboard', { ...conditions })),
            ).toEqual(true);
            expect(
                ability.can('manage', subject('Project', { ...conditions })),
            ).toEqual(true);
        });
    });

    /*
    describe('when user is an org admin and project viewer', () => {
        beforeEach(() => {
            const adminOrgProfile = {
                ...orgProfile,
                role: OrganizationMemberRole.ADMIN,
            };
            ability = UserModel.mergeUserAbilities(adminOrgProfile, [
                projectProfile,
            ]);
        });

        it('can manage org but cannot manage project', async () => {
            // Abilities from org
            expect(ability.can('manage', 'SavedChart')).toEqual(true);
            expect(ability.can('manage', 'Dashboard')).toEqual(true);
            expect(ability.can('manage', 'Project')).toEqual(true);

            // Abilities from project
            expect(
                ability.can(
                    'view',
                    subject('SavedChart', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(true);
            expect(
                ability.can(
                    'view',
                    subject('Dashboard', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(true);
            expect(
                ability.can(
                    'view',
                    subject('Project', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(true);

            expect(
                ability.can(
                    'manage',
                    subject('SavedChart', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(false);
            expect(
                ability.can(
                    'manage',
                    subject('Dashboard', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(false);
            expect(
                ability.can(
                    'manage',
                    subject('Project', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(false);
        });
    });
    describe('when user is an org viewer and project admin', () => {
        beforeEach(() => {
            const adminProjectProfile = {
                ...projectProfile,
                role: ProjectMemberRole.ADMIN,
            };
            ability = UserModel.mergeUserAbilities(orgProfile, [
                adminProjectProfile,
            ]);
        });

        it('cannot manage org but can manage project', async () => {
            console.log('ability ', ability);
            // Abilities from org
            expect(ability.can('view', 'SavedChart')).toEqual(true);
            expect(ability.can('view', 'Dashboard')).toEqual(true);
            expect(ability.can('view', 'Project')).toEqual(true);

            expect(ability.can('manage', 'SavedChart')).toEqual(false);
            expect(ability.can('manage', 'Dashboard')).toEqual(false);
            expect(ability.can('manage', 'Project')).toEqual(false);

            // Abilities from project
            expect(
                ability.can(
                    'manage',
                    subject('SavedChart', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(true);
            expect(
                ability.can(
                    'manage',
                    subject('Dashboard', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(true);
            expect(
                ability.can(
                    'manage',
                    subject('Project', {
                        projectUuid: projectProfile.projectUuid,
                    }),
                ),
            ).toEqual(true);

            expect(
                ability.can(
                    'manage',
                    subject('SavedChart', {
                        projectUuid: 'another-project-uuid',
                    }),
                ),
            ).toEqual(false);
            expect(
                ability.can(
                    'manage',
                    subject('Dashboard', {
                        projectUuid: 'another-project-uuid',
                    }),
                ),
            ).toEqual(false);
            expect(
                ability.can(
                    'manage',
                    subject('Project', { projectUuid: 'another-project-uuid' }),
                ),
            ).toEqual(false);
        });
    }); */
});
