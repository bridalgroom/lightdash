import { LightdashInstallType } from 'common';
import {
    inviteLinkModel,
    onboardingModel,
    organizationMemberProfileModel,
    organizationModel,
    projectModel,
} from '../../models/models';
import { OrganizationService } from './OrganizationService';
import { organisation, user } from './OrganizationService.mock';

jest.mock('../../models/models', () => ({
    projectModel: {
        hasProjects: jest.fn(async () => true),
    },
    organizationModel: {
        get: jest.fn(async () => organisation),
    },
}));
describe('organization service', () => {
    const organizationService = new OrganizationService({
        organizationModel,
        projectModel,
        onboardingModel,
        inviteLinkModel,
        organizationMemberProfileModel,
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        process.env = {
            LIGHTDASH_INSTALL_TYPE: LightdashInstallType.UNKNOWN,
        };
    });

    it('Should return needsProject false if there are projects in DB', async () => {
        expect(await organizationService.get(user)).toEqual({
            ...organisation,
            needsProject: false,
        });
    });
    it('Should return needsProject true if there are no projects in DB', async () => {
        (projectModel.hasProjects as jest.Mock).mockImplementationOnce(
            async () => false,
        );
        expect(await organizationService.get(user)).toEqual({
            ...organisation,
            needsProject: true,
        });
    });
    it('Should not return organization if user belongs to a different org', async () => {
        const anotherUser = {
            ...user,
            organizationUUid: 'another-org-uuid',
        };
        expect(await organizationService.get(anotherUser)).toEqual({
            ...organisation,
            needsProject: false,
        });
    });
});
