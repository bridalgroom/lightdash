import { analytics } from '../../analytics/client';
import {
    onboardingModel,
    projectModel,
    savedChartModel,
} from '../../models/models';
import { ProjectService } from './ProjectService';
import {
    allExplores,
    defaultProject,
    expectedAllExploreSummary,
    expectedCatalog,
    expectedExploreSummaryFilteredByName,
    expectedExploreSummaryFilteredByTags,
    expectedSqlResults,
    exploreWithAutoGeneratedMetrics,
    exploreWithError,
    exploreWithMetrics,
    projectAdapterMock,
    spacesWithNoSavedCharts,
    spacesWithSavedCharts,
    tablesConfiguration,
    tablesConfigurationWithNames,
    tablesConfigurationWithTags,
    user,
    validExplore,
} from './ProjectService.mock';

jest.mock('../../models/savedQueries', () => ({
    SavedQueriesModel: {
        getAllSpaces: jest.fn(async () => spacesWithSavedCharts),
    },
}));

jest.mock('../../analytics/client', () => ({
    analytics: {
        track: jest.fn(),
    },
}));

jest.mock('../../models/models', () => ({
    projectModel: {
        getTablesConfiguration: jest.fn(async () => tablesConfiguration),
        updateTablesConfiguration: jest.fn(),
        getDefaultProject: jest.fn(async () => defaultProject),
    },
    onboardingModel: {},
    savedChartModel: {
        getAllSpaces: jest.fn(async () => spacesWithSavedCharts),
    },
}));

describe('ProjectService', () => {
    const { projectUuid } = defaultProject;
    const service = new ProjectService({
        projectModel,
        onboardingModel,
        savedChartModel,
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    test('should get dashboard by uuid', async () => {
        service.projectAdapters[projectUuid] = projectAdapterMock;

        const result = await service.runSqlQuery(user, projectUuid, 'fake sql');

        expect(result).toEqual(expectedSqlResults);
        expect(analytics.track).toHaveBeenCalledTimes(1);
        expect(analytics.track).toHaveBeenCalledWith(
            expect.objectContaining({
                event: 'sql.executed',
            }),
        );
    });
    test('should get project catalog', async () => {
        service.cachedExplores[projectUuid] = Promise.resolve([
            exploreWithError,
            validExplore,
        ]);

        const results = await service.getCatalog(user, projectUuid);

        expect(results).toEqual(expectedCatalog);
    });
    test('should get tables configuration', async () => {
        const result = await service.getTablesConfiguration(user, projectUuid);
        expect(result).toEqual(tablesConfiguration);
    });
    test('should update tables configuration', async () => {
        await service.updateTablesConfiguration(
            user,
            projectUuid,
            tablesConfigurationWithNames,
        );
        expect(projectModel.updateTablesConfiguration).toHaveBeenCalledTimes(1);
        expect(analytics.track).toHaveBeenCalledTimes(1);
        expect(analytics.track).toHaveBeenCalledWith(
            expect.objectContaining({
                event: 'project_tables_configuration.updated',
            }),
        );
    });
    describe('getAllExploresSummary', () => {
        beforeEach(() => {
            service.cachedExplores[projectUuid] = Promise.resolve(allExplores);
        });
        test('should get all explores summary without filtering', async () => {
            const result = await service.getAllExploresSummary(
                user,
                projectUuid,
                false,
            );
            expect(result).toEqual(expectedAllExploreSummary);
        });
        test('should get all explores summary with filtering', async () => {
            const result = await service.getAllExploresSummary(
                user,
                projectUuid,
                true,
            );
            expect(result).toEqual(expectedAllExploreSummary);
        });
        test('should get explores summary filtered by tag', async () => {
            (
                projectModel.getTablesConfiguration as jest.Mock
            ).mockImplementationOnce(async () => tablesConfigurationWithTags);
            const result = await service.getAllExploresSummary(
                user,
                projectUuid,
                true,
            );
            expect(result).toEqual(expectedExploreSummaryFilteredByTags);
        });
        test('should get explores summary filtered by name', async () => {
            (
                projectModel.getTablesConfiguration as jest.Mock
            ).mockImplementationOnce(async () => tablesConfigurationWithNames);
            const result = await service.getAllExploresSummary(
                user,
                projectUuid,
                true,
            );
            expect(result).toEqual(expectedExploreSummaryFilteredByName);
        });
    });
    describe('hasMetrics', () => {
        test('should return true when there are non auto generated metrics', async () => {
            service.cachedExplores[projectUuid] = Promise.resolve([
                ...allExplores,
                exploreWithMetrics,
            ]);
            expect(await service.hasMetrics(user)).toEqual(true);
        });
        test('should return false when there are only auto generated metrics', async () => {
            service.cachedExplores[projectUuid] = Promise.resolve([
                ...allExplores,
                exploreWithAutoGeneratedMetrics,
            ]);
            expect(await service.hasMetrics(user)).toEqual(false);
        });
    });
    describe('hasSavedCharts', () => {
        test('should return true when there are saved charts', async () => {
            expect(await service.hasSavedCharts(user)).toEqual(true);
        });
        test('should return false when there are no saved charts', async () => {
            (savedChartModel.getAllSpaces as jest.Mock).mockImplementationOnce(
                async () => spacesWithNoSavedCharts,
            );
            expect(await service.hasSavedCharts(user)).toEqual(false);
        });
    });
});
