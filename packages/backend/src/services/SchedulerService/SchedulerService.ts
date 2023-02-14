import { subject } from '@casl/ability';
import {
    Dashboard,
    ForbiddenError,
    isChartScheduler,
    SavedChart,
    ScheduledJobs,
    Scheduler,
    SchedulerAndTargets,
    SessionUser,
    UpdateSchedulerAndTargetsWithoutId,
} from '@lightdash/common';
import cronstrue from 'cronstrue';
import { analytics } from '../../analytics/client';
import { schedulerClient, slackClient } from '../../clients/clients';
import { LightdashConfig } from '../../config/parseConfig';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { SchedulerModel } from '../../models/SchedulerModel';

type ServiceDependencies = {
    lightdashConfig: LightdashConfig;
    schedulerModel: SchedulerModel;

    dashboardModel: DashboardModel;

    savedChartModel: SavedChartModel;
};

export class SchedulerService {
    lightdashConfig: LightdashConfig;

    schedulerModel: SchedulerModel;

    dashboardModel: DashboardModel;

    savedChartModel: SavedChartModel;

    constructor({
        lightdashConfig,
        schedulerModel,
        dashboardModel,
        savedChartModel,
    }: ServiceDependencies) {
        this.lightdashConfig = lightdashConfig;
        this.schedulerModel = schedulerModel;
        this.dashboardModel = dashboardModel;
        this.savedChartModel = savedChartModel;
    }

    private async getSchedulerResource(
        scheduler: Scheduler,
    ): Promise<SavedChart | Dashboard> {
        return isChartScheduler(scheduler)
            ? this.savedChartModel.get(scheduler.savedChartUuid)
            : this.dashboardModel.getById(scheduler.dashboardUuid);
    }

    private async checkUserCanUpdateSchedulerResource(
        user: SessionUser,
        schedulerUuid: string,
    ): Promise<{ scheduler: Scheduler; resource: SavedChart | Dashboard }> {
        const scheduler = await this.schedulerModel.getScheduler(schedulerUuid);
        const resource = await this.getSchedulerResource(scheduler);
        const { organizationUuid, projectUuid } = resource;
        if (
            isChartScheduler(scheduler) &&
            user.ability.cannot(
                'update',
                subject('SavedChart', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        } else if (
            user.ability.cannot(
                'update',
                subject('Dashboard', { organizationUuid, projectUuid }),
            )
        ) {
            throw new ForbiddenError();
        }
        return { scheduler, resource };
    }

    async getAllSchedulers(): Promise<SchedulerAndTargets[]> {
        return this.schedulerModel.getAllSchedulers();
    }

    async getScheduler(
        user: SessionUser,
        schedulerUuid: string,
    ): Promise<SchedulerAndTargets> {
        return this.schedulerModel.getSchedulerAndTargets(schedulerUuid);
    }

    async updateScheduler(
        user: SessionUser,
        schedulerUuid: string,
        updatedScheduler: UpdateSchedulerAndTargetsWithoutId,
    ): Promise<SchedulerAndTargets> {
        const {
            resource: { organizationUuid, projectUuid },
        } = await this.checkUserCanUpdateSchedulerResource(user, schedulerUuid);

        await schedulerClient.deleteScheduledJobs(schedulerUuid);

        const scheduler = await this.schedulerModel.updateScheduler({
            ...updatedScheduler,
            schedulerUuid,
        });
        analytics.track({
            userId: user.userUuid,
            event: 'scheduler.updated',
            properties: {
                projectId: projectUuid,
                organizationId: organizationUuid,
                schedulerId: scheduler.schedulerUuid,
                resourceType: isChartScheduler(scheduler)
                    ? 'chart'
                    : 'dashboard',
                cronExpression: scheduler.cron,
                cronString: cronstrue.toString(scheduler.cron, {
                    verbose: true,
                    throwExceptionOnParseError: false,
                }),
                resourceId: isChartScheduler(scheduler)
                    ? scheduler.savedChartUuid
                    : scheduler.dashboardUuid,
                targets: scheduler.targets.map((target) => ({
                    schedulerTargetId: target.schedulerSlackTargetUuid,
                    type: 'slack',
                })),
            },
        });
        await slackClient.joinChannels(
            user.organizationUuid,
            SchedulerModel.getSlackChannels(scheduler.targets),
        );

        await schedulerClient.generateDailyJobsForScheduler(scheduler);

        return scheduler;
    }

    async deleteScheduler(
        user: SessionUser,
        schedulerUuid: string,
    ): Promise<void> {
        const {
            scheduler,
            resource: { organizationUuid, projectUuid },
        } = await this.checkUserCanUpdateSchedulerResource(user, schedulerUuid);
        await schedulerClient.deleteScheduledJobs(schedulerUuid);
        await this.schedulerModel.deleteScheduler(schedulerUuid);

        analytics.track({
            userId: user.userUuid,
            event: 'scheduler.deleted',
            properties: {
                projectId: projectUuid,
                organizationId: organizationUuid,
                schedulerId: scheduler.schedulerUuid,
                resourceType: isChartScheduler(scheduler)
                    ? 'chart'
                    : 'dashboard',
                resourceId: isChartScheduler(scheduler)
                    ? scheduler.savedChartUuid
                    : scheduler.dashboardUuid,
            },
        });
    }

    async getScheduledJobs(
        user: SessionUser,
        schedulerUuid: string,
    ): Promise<ScheduledJobs[]> {
        await this.checkUserCanUpdateSchedulerResource(user, schedulerUuid);
        return schedulerClient.getScheduledJobs(schedulerUuid);
    }
}
