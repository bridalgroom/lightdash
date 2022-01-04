import {
    ApiSqlQueryResults,
    Explore,
    ExploreError,
    FieldType,
    MetricType,
    OrganizationProject,
    SessionUser,
    Space,
    SummaryExplore,
    SupportedDbtAdapter,
    TablesConfiguration,
    TableSelectionType,
} from 'common';
import { ProjectAdapter } from '../../types';

export const user: SessionUser = {
    userUuid: 'userUuid',
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    organizationUuid: 'organizationUuid',
    organizationName: 'organizationName',
    isTrackingAnonymized: false,
    userId: 0,
};

export const expectedTablesConfiguration: TablesConfiguration = {
    tableSelection: {
        type: TableSelectionType.ALL,
        value: null,
    },
};

export const updateTablesConfiguration: TablesConfiguration = {
    tableSelection: {
        type: TableSelectionType.WITH_NAMES,
        value: ['tableName'],
    },
};

export const expectedSqlResults: ApiSqlQueryResults = {
    rows: [{ col1: 'val1' }],
};

export const projectAdapterMock: ProjectAdapter = {
    compileAllExplores: jest.fn(),
    getDbtPackages: jest.fn(),
    test: jest.fn(),
    destroy: jest.fn(),
    runQuery: jest.fn(async () => expectedSqlResults.rows),
};

export const validExplore: Explore = {
    targetDatabase: SupportedDbtAdapter.POSTGRES,
    name: 'valid_explore',
    label: 'valid_explore',
    tags: [],
    baseTable: 'a',
    joinedTables: [],
    tables: {
        a: {
            name: 'a',
            label: 'a',
            database: 'database',
            schema: 'schema',
            sqlTable: 'test.table',
            dimensions: {},
            metrics: {},
            lineageGraph: {},
        },
    },
};

export const exploreWithError: ExploreError = {
    name: 'error',
    label: 'error',
    errors: [],
};

export const exploreWithTags: ExploreError = {
    ...exploreWithError,
    tags: ['tag_name', 'another_tag'],
};

export const exploreWithMetrics: Explore = {
    ...validExplore,
    tables: {
        a: {
            name: 'a',
            label: 'a',
            database: 'database',
            schema: 'schema',
            sqlTable: 'test.table',
            dimensions: {},
            metrics: {
                myMetric: {
                    table: 'a',
                    sql: 'sql',
                    name: 'myMetric',
                    label: 'myMetric',
                    fieldType: FieldType.METRIC,
                    type: MetricType.NUMBER,
                    isAutoGenerated: false,
                    compiledSql: 'compiledSql',
                },
            },
            lineageGraph: {},
        },
    },
};

export const exploreWithAutoGeneratedMetrics: Explore = {
    ...exploreWithMetrics,
    tables: {
        a: {
            ...exploreWithMetrics.tables.a,
            metrics: {
                myMetric: {
                    ...exploreWithMetrics.tables.a.metrics.myMetric,
                    isAutoGenerated: true,
                },
            },
        },
    },
};

export const allExplores = [validExplore, exploreWithError, exploreWithTags];

export const expectedAllExploreSummary: SummaryExplore[] = [
    {
        name: validExplore.name,
        label: validExplore.label,
        tags: validExplore.tags,
    },
    {
        name: exploreWithError.name,
        label: exploreWithError.label,
        errors: exploreWithError.errors,
    },
    {
        name: exploreWithTags.name,
        label: exploreWithTags.label,
        tags: exploreWithTags.tags,
        errors: exploreWithTags.errors,
    },
];

export const expectedExploreSummaryFilteredByTags = [
    expectedAllExploreSummary[2],
];
export const expectedExploreSummaryFilteredByName = [
    expectedAllExploreSummary[0],
];

export const tablesConfiguration: TablesConfiguration = {
    tableSelection: {
        type: TableSelectionType.ALL,
        value: null,
    },
};

export const tablesConfigurationWithTags: TablesConfiguration = {
    tableSelection: {
        type: TableSelectionType.WITH_TAGS,
        value: [exploreWithTags.tags![0]],
    },
};

export const tablesConfigurationWithNames: TablesConfiguration = {
    tableSelection: {
        type: TableSelectionType.WITH_NAMES,
        value: [validExplore.name],
    },
};

export const expectedCatalog = {
    database: {
        schema: {
            a: {
                description: undefined,
                sqlTable: 'test.table',
            },
        },
    },
};

export const defaultProject: OrganizationProject = {
    projectUuid: 'projectUuid',
    name: 'name',
};

export const spacesWithSavedCharts: Space[] = [
    {
        name: 'sapce',
        uuid: 'uuid',
        queries: [
            {
                uuid: 'savedChartUuid',
                name: 'saved chart name',
                updatedAt: new Date(),
            },
        ],
    },
];

export const spacesWithNoSavedCharts: Space[] = [
    {
        name: 'sapce',
        uuid: 'uuid',
        queries: [],
    },
];
