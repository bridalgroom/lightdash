import { ScheduledJobs, SchedulerAndTargets } from '@lightdash/common';
import { getSchedule, stringToArray } from 'cron-converter';
import { makeWorkerUtils, WorkerUtils } from 'graphile-worker';
import moment from 'moment';
import { LightdashConfig } from '../config/parseConfig';
import Logger from '../logger';

type SchedulerClientDependencies = {
    lightdashConfig: LightdashConfig;
};

export const getDailyDatesFromCron = (
    cron: string,
    when = new Date(),
): Date[] => {
    const arr = stringToArray(cron);
    const startOfMinute = moment(when).startOf('minute').toDate(); // round down to the nearest minute so we can even process 00:00 on daily jobs
    const schedule = getSchedule(arr, startOfMinute, 'UTC');

    const tomorrow = moment(startOfMinute)
        .utc()
        .add(1, 'day')
        .startOf('day')
        .toDate();

    const dailyDates: Date[] = [];
    while (schedule.next() < tomorrow) {
        dailyDates.push(schedule.date.toJSDate());
    }

    return dailyDates;
};

export class SchedulerClient {
    lightdashConfig: LightdashConfig;

    graphileUtils: WorkerUtils | undefined;

    constructor({ lightdashConfig }: SchedulerClientDependencies) {
        this.lightdashConfig = lightdashConfig;
        this.start();
    }

    async start() {
        this.graphileUtils = await makeWorkerUtils({});
        this.graphileUtils?.migrate();
    }

    async getScheduledJobs(schedulerUuid: string): Promise<ScheduledJobs[]> {
        if (this.graphileUtils === undefined)
            throw new Error('Graphile utils not initialized');

        const scheduledJobs = await this.graphileUtils.withPgClient(
            (pgClient) =>
                pgClient.query(
                    "select id, run_at , payload->>'channel' as channel from graphile_worker.jobs where payload->>'schedulerUuid' like $1",
                    [`${schedulerUuid}%`],
                ),
        );

        return scheduledJobs.rows.map((r) => ({
            id: r.id,
            channel: r.channel,
            date: r.run_at,
        }));
    }

    async deleteScheduledJobs(schedulerUuid: string): Promise<void> {
        if (this.graphileUtils === undefined)
            throw new Error('Graphile utils not initialized');

        const deletedJobs = await this.graphileUtils.withPgClient((pgClient) =>
            pgClient.query(
                "select id from graphile_worker.jobs where payload->>'schedulerUuid' like $1",
                [`${schedulerUuid}%`],
            ),
        );
        Logger.info(
            `Deleting ${deletedJobs.rows.length} Slack notification scheduled jobs: ${schedulerUuid}`,
        );
        const deletedJobIds = deletedJobs.rows.map((r) => r.id);

        await this.graphileUtils.completeJobs(deletedJobIds);
    }

    async generateDailyJobsForScheduler(
        scheduler: SchedulerAndTargets,
    ): Promise<void> {
        if (this.graphileUtils === undefined)
            throw new Error('Graphile utils not initialized');

        const dates = getDailyDatesFromCron(scheduler.cron);
        const graphileClient = await this.graphileUtils;
        try {
            const promises = dates.flatMap((date: Date) =>
                scheduler.targets.map((target) =>
                    graphileClient.addJob(
                        'sendSlackNotification',
                        { channel: target.channel, ...scheduler },
                        {
                            runAt: date,
                            maxAttempts: 2,
                        },
                    ),
                ),
            );

            Logger.info(
                `Creating new ${promises.length} Slack notification jobs: ${scheduler.name}`,
            );
            await Promise.all(promises);
        } catch (err: any) {
            Logger.error(`Unable to schedule job ${scheduler.name}`, err);
        }
    }
}
