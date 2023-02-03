import { getDailyDatesFromCron } from './SchedulerWorker';

describe('Cron converter', () => {
    test('Should convert cron into daily dates', () => {
        const when = new Date(2023, 0, 1); // Beggining of the day
        const executionDates = getDailyDatesFromCron('0 * * * *', when); // Every hour

        expect(executionDates.length).toStrictEqual(24);
    });

    test('Make sure we can schedule at midnight', () => {
        const when = new Date(2023, 0, 1, 0, 0, 30); // Beggining of the day (30 seconds after midnight)
        const executionDates = getDailyDatesFromCron('0 * * * *', when); // Every hour

        expect(executionDates[0]).toStrictEqual(new Date(2023, 0, 1, 0, 0, 0)); // First execution should be at midnight
    });

    test('Beginning and end of workday', () => {
        const when = new Date(2023, 0, 1, 0, 0, 30); // Beggining of the day (30 seconds after midnight)
        const executionDates = getDailyDatesFromCron('30 9,18 * * *', when); // at 9:30 and 18:30

        expect(executionDates).toStrictEqual([
            new Date(2023, 0, 1, 9, 30, 0),
            new Date(2023, 0, 1, 18, 30, 0),
        ]);
    });

    test('Get empty dates if scheduled on a different day', () => {
        const when = new Date(2023, 0, 1); // Beggining of the day
        const executionDates = getDailyDatesFromCron('0 * 30 * *', when); // every 30th day of the month

        expect(executionDates).toStrictEqual([]);
    });
});
