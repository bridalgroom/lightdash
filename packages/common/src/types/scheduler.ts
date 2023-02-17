export type SchedulerBase = {
    schedulerUuid: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    format: 'csv' | 'image';
    cron: string;
    savedChartUuid: string | null;
    dashboardUuid: string | null;
};

export type ChartScheduler = SchedulerBase & {
    savedChartUuid: string;
    dashboardUuid: null;
};
export type DashboardScheduler = SchedulerBase & {
    savedChartUuid: null;
    dashboardUuid: string;
};

export type Scheduler = ChartScheduler | DashboardScheduler;

export type SchedulerAndTargets = Scheduler & {
    targets: (SchedulerSlackTarget | SchedulerEmailTarget)[];
};

export type SchedulerSlackTarget = {
    schedulerSlackTargetUuid: string;
    createdAt: Date;
    updatedAt: Date;
    schedulerUuid: string;
    channel: string;
};

export type SchedulerEmailTarget = {
    schedulerEmailTargetUuid: string;
    createdAt: Date;
    updatedAt: Date;
    schedulerUuid: string;
    recipient: string;
};

export type CreateSchedulerTarget =
    | Pick<SchedulerSlackTarget, 'channel'>
    | Pick<SchedulerEmailTarget, 'recipient'>;
export type UpdateSchedulerSlackTarget = Pick<
    SchedulerSlackTarget,
    'schedulerSlackTargetUuid' | 'channel'
>;

export type UpdateSchedulerEmailTarget = Pick<
    SchedulerEmailTarget,
    'schedulerEmailTargetUuid' | 'recipient'
>;

export type CreateSchedulerAndTargets = Omit<
    Scheduler,
    'schedulerUuid' | 'createdAt' | 'updatedAt'
> & {
    targets: CreateSchedulerTarget[];
};

export type CreateSchedulerAndTargetsWithoutIds = Omit<
    CreateSchedulerAndTargets,
    'savedChartUuid' | 'dashboardUuid' | 'createdBy'
>;

export type UpdateSchedulerAndTargets = Pick<
    Scheduler,
    'schedulerUuid' | 'name' | 'cron' | 'format'
> & {
    targets: Array<
        | CreateSchedulerTarget
        | UpdateSchedulerSlackTarget
        | UpdateSchedulerEmailTarget
    >;
};

export type UpdateSchedulerAndTargetsWithoutId = Omit<
    UpdateSchedulerAndTargets,
    'schedulerUuid'
>;

export const isUpdateSchedulerSlackTarget = (
    data: CreateSchedulerTarget | UpdateSchedulerSlackTarget,
): data is UpdateSchedulerSlackTarget =>
    'schedulerSlackTargetUuid' in data && !!data.schedulerSlackTargetUuid;

export const isUpdateSchedulerEmailTarget = (
    data: CreateSchedulerTarget | UpdateSchedulerEmailTarget,
): data is UpdateSchedulerEmailTarget =>
    'schedulerEmailTargetUuid' in data && !!data.schedulerEmailTargetUuid;

export const isChartScheduler = (data: Scheduler): data is ChartScheduler =>
    'savedChartUuid' in data && !!data.savedChartUuid;

export const isSlackTarget = (
    target: SchedulerSlackTarget | SchedulerEmailTarget,
): target is SchedulerSlackTarget => 'channel' in target;

export const isCreateSchedulerSlackTarget = (
    target:
        | Pick<SchedulerSlackTarget, 'channel'>
        | Pick<SchedulerEmailTarget, 'recipient'>,
): target is Pick<SchedulerSlackTarget, 'channel'> => 'channel' in target;

export type ApiSchedulerAndTargetsResponse = {
    status: 'ok';
    results: SchedulerAndTargets;
};

export type ScheduledJobs = {
    date: Date;
    id: string;
    channel?: string;
};
export type ApiScheduledJobsResponse = {
    status: 'ok';
    results: ScheduledJobs[];
};

// Scheduler task types

export type ScheduledSlackNotification = Pick<
    SchedulerBase,
    | 'createdBy'
    | 'savedChartUuid'
    | 'dashboardUuid'
    | 'schedulerUuid'
    | 'format'
> &
    Pick<SchedulerSlackTarget, 'channel' | 'schedulerSlackTargetUuid'>;

export type ScheduledEmailNotification = Pick<
    SchedulerBase,
    | 'createdBy'
    | 'savedChartUuid'
    | 'dashboardUuid'
    | 'schedulerUuid'
    | 'name'
    | 'format'
> &
    Pick<SchedulerEmailTarget, 'recipient' | 'schedulerEmailTargetUuid'>;
