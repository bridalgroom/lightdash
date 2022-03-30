import EmailClient from '../clients/EmailClient/EmailClient';
import { lightdashConfig } from '../config/lightdashConfig';
import {
    dashboardModel,
    emailModel,
    inviteLinkModel,
    onboardingModel,
    openIdIdentityModel,
    organizationMemberProfileModel,
    organizationModel,
    passwordResetLinkModel,
    projectModel,
    savedChartModel,
    sessionModel,
    themeModel,
    userModel,
} from '../models/models';
import { DashboardService } from './DashboardService/DashboardService';
import { HealthService } from './HealthService/HealthService';
import { OrganizationService } from './OrganizationService/OrganizationService';
import { ProjectService } from './ProjectService/ProjectService';
import { SavedChartService } from './SavedChartsService/SavedChartService';
import { UserService } from './UserService';

const emailClient = new EmailClient({ lightdashConfig });

export const userService = new UserService({
    inviteLinkModel,
    userModel,
    sessionModel,
    emailModel,
    openIdIdentityModel,
    passwordResetLinkModel,
    emailClient,
    organizationMemberProfileModel,
    organizationModel,
});
export const organizationService = new OrganizationService({
    organizationModel,
    projectModel,
    onboardingModel,
    inviteLinkModel,
    organizationMemberProfileModel,
    themeModel,
});

export const projectService = new ProjectService({
    projectModel,
    onboardingModel,
    savedChartModel,
});

export const healthService = new HealthService({
    userModel,
    projectModel,
    lightdashConfig,
});

export const dashboardService = new DashboardService({
    dashboardModel,
});

export const savedChartsService = new SavedChartService({
    projectModel,
    savedChartModel,
});
