import { SchedulerJobStatus } from '@lightdash/common';
import opentelemetry, { SpanStatusCode } from '@opentelemetry/api';
import { getSchedule, stringToArray } from 'cron-converter';
import {
    JobHelpers,
    Logger as GraphileLogger,
    parseCronItems,
    run as runGraphileWorker,
    Runner,
    Task,
    TaskList,
} from 'graphile-worker';
import moment from 'moment';
import { schedulerClient } from '../clients/clients';
import { LightdashConfig } from '../config/parseConfig';
import Logger from '../logging/logger';
import { schedulerService } from '../services/services';
import { VERSION } from '../version';
import { tryJobOrTimeout } from './SchedulerJobTimeout';
import {
    compileProject,
    downloadCsv,
    handleScheduledDelivery,
    sendEmailNotification,
    sendGsheetsNotification,
    sendSlackNotification,
    testAndCompileProject,
    uploadGsheetFromQuery,
    validateProject,
} from './SchedulerTask';
import schedulerWorkerEventEmitter from './SchedulerWorkerEventEmitter';

type SchedulerWorkerDependencies = {
    lightdashConfig: LightdashConfig;
};

const meter = opentelemetry.metrics.getMeter('lightdash-worker', VERSION);
const tracer = opentelemetry.trace.getTracer('lightdash-worker', VERSION);
const taskDurationHistogram = meter.createHistogram<{
    task_name: string;
    error: boolean;
}>('worker.task.duration_ms', {
    description: 'Duration of worker tasks in milliseconds',
    unit: 'milliseconds',
});

const traceTask = (taskName: string, task: Task): Task => {
    const tracedTask: Task = async (payload, helpers) => {
        await tracer.startActiveSpan(
            `worker.task.${taskName}`,
            async (span) => {
                const { job } = helpers;
                span.setAttributes({
                    'worker.task.name': taskName,
                    'worker.job.id': job.id,
                    'worker.job.task_identifier': job.task_identifier,
                    'worker.job.attempts': job.attempts,
                    'worker.job.max_attempts': job.max_attempts,
                });
                if (job.locked_at) {
                    span.setAttribute(
                        'worker.job.locked_at',
                        moment(job.locked_at).toISOString(),
                    );
                }
                if (job.created_at) {
                    span.setAttribute(
                        'worker.job.created_at',
                        job.created_at.toISOString(),
                    );
                }
                if (job.locked_by) {
                    span.setAttribute('worker.job.locked_by', job.locked_by);
                }
                if (job.key) {
                    span.setAttribute('worker.job.key', job.key);
                }
                const startTime = Date.now();
                let hasError = false;
                try {
                    await task(payload, helpers);
                } catch (e) {
                    hasError = true;
                    span.recordException(e);
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                    });
                    throw e;
                } finally {
                    span.end();
                    const executionTime = Date.now() - startTime;
                    taskDurationHistogram.record(executionTime, {
                        task_name: taskName,
                        error: hasError,
                    });
                }
            },
        );
    };
    return tracedTask;
};

const traceTasks = (tasks: TaskList) => {
    const tracedTasks = Object.keys(tasks).reduce<TaskList>(
        (accTasks, taskName) => ({
            ...accTasks,
            [taskName]: traceTask(taskName, tasks[taskName]),
        }),
        {} as TaskList,
    );
    return tracedTasks;
};

export const getDailyDatesFromCron = (
    cron: string,
    when = new Date(),
): Date[] => {
    const arr = stringToArray(cron);
    const startOfMinute = moment(when).startOf('minute').toDate(); // round down to the nearest minute so we can even process 00:00 on daily jobs
    const schedule = getSchedule(arr, startOfMinute, 'UTC');
    const tomorrow = moment(startOfMinute)
        .add(1, 'day')
        .startOf('day')
        .toDate();
    const dailyDates: Date[] = [];
    while (schedule.next() < tomorrow) {
        dailyDates.push(schedule.date.toJSDate());
    }
    return dailyDates;
};

const workerLogger = new GraphileLogger((scope) => (_, message, meta) => {
    Logger.debug(message, { meta, scope });
});

export class SchedulerWorker {
    lightdashConfig: LightdashConfig;

    runner: Runner | undefined;

    isRunning: boolean = false;

    constructor({ lightdashConfig }: SchedulerWorkerDependencies) {
        this.lightdashConfig = lightdashConfig;
    }

    async run() {
        // Wait for graphile utils to finish migration and prevent race conditions
        await schedulerClient.graphileUtils;
        // Run a worker to execute jobs:
        Logger.info('Running scheduler');

        this.runner = await runGraphileWorker({
            connectionString: this.lightdashConfig.database.connectionUri,
            logger: workerLogger,
            concurrency: this.lightdashConfig.scheduler?.concurrency,
            noHandleSignals: true,
            pollInterval: 1000,
            parsedCronItems: parseCronItems([
                {
                    task: 'generateDailyJobs',
                    pattern: '0 0 * * *',
                    options: {
                        backfillPeriod: 12 * 3600 * 1000, // 12 hours in ms
                        maxAttempts: 1,
                    },
                },
            ]),
            taskList: traceTasks({
                generateDailyJobs: async () => {
                    const schedulers =
                        await schedulerService.getAllSchedulers();
                    const promises = schedulers.map(async (scheduler) => {
                        await schedulerClient.generateDailyJobsForScheduler(
                            scheduler,
                        );
                    });

                    await Promise.all(promises);
                },
                handleScheduledDelivery: async (
                    payload: any,
                    helpers: JobHelpers,
                ) => {
                    await tryJobOrTimeout(
                        handleScheduledDelivery(
                            helpers.job.id,
                            helpers.job.run_at,
                            payload,
                        ),
                        helpers.job,
                        this.lightdashConfig.scheduler.jobTimeout,
                        async (job, e) => {
                            await schedulerService.logSchedulerJob({
                                task: 'handleScheduledDelivery',
                                schedulerUuid: payload.schedulerUuid,
                                jobId: job.id,
                                scheduledTime: job.run_at,
                                jobGroup: payload.jobGroup,
                                status: SchedulerJobStatus.ERROR,
                                details: { error: e.message },
                            });
                        },
                    );
                },
                sendSlackNotification: async (
                    payload: any,
                    helpers: JobHelpers,
                ) => {
                    await tryJobOrTimeout(
                        sendSlackNotification(helpers.job.id, payload),
                        helpers.job,
                        this.lightdashConfig.scheduler.jobTimeout,
                        async (job, e) => {
                            await schedulerService.logSchedulerJob({
                                task: 'sendSlackNotification',
                                schedulerUuid: payload.schedulerUuid,
                                jobId: job.id,
                                scheduledTime: job.run_at,
                                jobGroup: payload.jobGroup,
                                targetType: 'slack',
                                status: SchedulerJobStatus.ERROR,
                                details: { error: e.message },
                            });
                        },
                    );
                },
                sendEmailNotification: async (
                    payload: any,
                    helpers: JobHelpers,
                ) => {
                    await tryJobOrTimeout(
                        sendEmailNotification(helpers.job.id, payload),
                        helpers.job,
                        this.lightdashConfig.scheduler.jobTimeout,
                        async (job, e) => {
                            await schedulerService.logSchedulerJob({
                                task: 'sendEmailNotification',
                                schedulerUuid: payload.schedulerUuid,
                                jobId: job.id,
                                scheduledTime: job.run_at,
                                jobGroup: payload.jobGroup,
                                targetType: 'email',
                                status: SchedulerJobStatus.ERROR,
                                details: { error: e.message },
                            });
                        },
                    );
                },
                sendGsheetsNotification: async (
                    payload: any,
                    helpers: JobHelpers,
                ) => {
                    await tryJobOrTimeout(
                        sendGsheetsNotification(helpers.job.id, payload),
                        helpers.job,
                        this.lightdashConfig.scheduler.jobTimeout,
                        async (job, e) => {
                            await schedulerService.logSchedulerJob({
                                task: 'sendGsheetsNotification',
                                schedulerUuid: payload.schedulerUuid,
                                jobId: job.id,
                                scheduledTime: job.run_at,
                                jobGroup: payload.jobGroup,
                                targetType: 'gsheets',
                                status: SchedulerJobStatus.ERROR,
                                details: { error: e.message },
                            });
                        },
                    );
                },
                downloadCsv: async (payload: any, helpers: JobHelpers) => {
                    await tryJobOrTimeout(
                        downloadCsv(
                            helpers.job.id,
                            helpers.job.run_at,
                            payload,
                        ),
                        helpers.job,
                        this.lightdashConfig.scheduler.jobTimeout,
                        async (job, e) => {
                            await schedulerService.logSchedulerJob({
                                task: 'downloadCsv',
                                jobId: job.id,
                                scheduledTime: job.run_at,
                                status: SchedulerJobStatus.ERROR,
                                details: {
                                    createdByUserUuid: payload.userUuid,
                                    error: e.message,
                                },
                            });
                        },
                    );
                },
                uploadGsheetFromQuery: async (
                    payload: any,
                    helpers: JobHelpers,
                ) => {
                    await tryJobOrTimeout(
                        uploadGsheetFromQuery(
                            helpers.job.id,
                            helpers.job.run_at,
                            payload,
                        ),
                        helpers.job,
                        this.lightdashConfig.scheduler.jobTimeout,
                        async (job, e) => {
                            await schedulerService.logSchedulerJob({
                                task: 'uploadGsheetFromQuery',
                                jobId: job.id,
                                scheduledTime: job.run_at,
                                status: SchedulerJobStatus.ERROR,
                                details: {
                                    createdByUserUuid: payload.userUuid,
                                    error: e.message,
                                },
                            });
                        },
                    );
                },
                compileProject: async (payload: any, helpers: JobHelpers) => {
                    await compileProject(
                        helpers.job.id,
                        helpers.job.run_at,
                        payload,
                    );
                },
                testAndCompileProject: async (
                    payload: any,
                    helpers: JobHelpers,
                ) => {
                    await testAndCompileProject(
                        helpers.job.id,
                        helpers.job.run_at,
                        payload,
                    );
                },
                validateProject: async (payload: any, helpers: JobHelpers) => {
                    await validateProject(
                        helpers.job.id,
                        helpers.job.run_at,
                        payload,
                    );
                },
            }),
            events: schedulerWorkerEventEmitter,
        });

        this.isRunning = true;
        await this.runner.promise.finally(() => {
            this.isRunning = false;
        });
    }
}
