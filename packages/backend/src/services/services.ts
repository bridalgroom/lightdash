import { lightdashConfig } from '../config/lightdashConfig';
import {
    dashboardModel,
    emailModel,
    inviteLinkModel,
    onboardingModel,
    organizationModel,
    projectModel,
    sessionModel,
    userModel,
} from '../models/models';
import { DashboardService } from './DashboardService/DashboardService';
import { HealthService } from './HealthService/HealthService';
import { OrganizationService } from './OrganizationService/OrganizationService';
import { ProjectService } from './ProjectService/ProjectService';
import { SavedChartsService } from './SavedChartsService/SavedChartsService';
import { UserService } from './UserService';

export const userService = new UserService({
    inviteLinkModel,
    userModel,
    sessionModel,
    emailModel,
});
export const organizationService = new OrganizationService({
    organizationModel,
    userModel,
    projectModel,
    onboardingModel,
    inviteLinkModel,
});

export const projectService = new ProjectService({
    projectModel,
    onboardingModel,
});

export const healthService = new HealthService({
    userModel,
    projectModel,
    lightdashConfig,
});

export const dashboardService = new DashboardService({
    dashboardModel,
});

export const savedChartsService = new SavedChartsService({
    projectModel,
});
