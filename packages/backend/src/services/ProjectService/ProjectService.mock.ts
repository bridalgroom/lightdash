import { Ability } from '@casl/ability';
import {
    ApiSqlQueryResults,
    ChartKind,
    DbtCloudIDEProjectConfig,
    DbtProjectType,
    Explore,
    ExploreError,
    FieldType,
    Job,
    JobLabels,
    JobStatusType,
    JobStepStatusType,
    JobStepType,
    JobType,
    MetricType,
    OrganizationMemberRole,
    OrganizationProject,
    Project,
    ProjectType,
    SessionUser,
    Space,
    SummaryExplore,
    SupportedDbtAdapter,
    TablesConfiguration,
    TableSelectionType,
} from '@lightdash/common';
import { LightdashConfig } from '../../config/parseConfig';
import { projectUuid } from '../../models/ProjectModel/ProjectModel.mock';
import { ProjectAdapter } from '../../types';

export const user: SessionUser = {
    userUuid: 'userUuid',
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    organizationUuid: 'organizationUuid',
    organizationName: 'organizationName',
    organizationCreatedAt: new Date(),
    isTrackingAnonymized: false,
    isMarketingOptedIn: false,
    isSetupComplete: true,
    userId: 0,
    role: OrganizationMemberRole.ADMIN,
    ability: new Ability([
        { subject: 'Project', action: ['update', 'view'] },
        { subject: 'Job', action: ['view'] },
        { subject: 'SqlRunner', action: ['manage'] },
    ]),
    isActive: true,
    abilityRules: [],
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
    fields: {},
    rows: [{ col1: 'val1' }],
};

export const projectAdapterMock: ProjectAdapter = {
    compileAllExplores: jest.fn(),
    getDbtPackages: jest.fn(),
    test: jest.fn(),
    destroy: jest.fn(),
    runQuery: jest.fn(async () => expectedSqlResults),
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
                    tableLabel: 'a',
                    sql: 'sql',
                    name: 'myMetric',
                    label: 'myMetric',
                    fieldType: FieldType.METRIC,
                    type: MetricType.NUMBER,
                    isAutoGenerated: false,
                    compiledSql: 'compiledSql',
                    tablesReferences: undefined,
                    hidden: false,
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
        databaseName: validExplore.tables[validExplore.baseTable].database,
        schemaName: validExplore.tables[validExplore.baseTable].schema,
        description: validExplore.tables[validExplore.baseTable].description,
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

export const projectWithSensitiveFields: Project = {
    organizationUuid: user.organizationUuid!,
    projectUuid: 'projectUuid',
    name: 'name',
    type: ProjectType.DEFAULT,
    dbtConnection: {
        account_id: 'account_id',
        environment_id: 'environment_id',
        name: 'name',
        project_id: 'project_id',
        type: DbtProjectType.DBT_CLOUD_IDE,
    } as any as DbtCloudIDEProjectConfig,
};
export const defaultProject: OrganizationProject = {
    projectUuid: 'projectUuid',
    name: 'name',
    type: ProjectType.DEFAULT,
};

export const spacesWithSavedCharts: Space[] = [
    {
        organizationUuid: user.organizationUuid!,
        name: 'sapce',
        isPrivate: false,
        uuid: 'uuid',
        pinnedListUuid: null,
        queries: [
            {
                uuid: 'savedChartUuid',
                name: 'saved chart name',
                updatedAt: new Date(),
                spaceUuid: 'uuid',
                pinnedListUuid: null,
                chartType: ChartKind.AREA,
                views: 1,
                firstViewedAt: new Date().toJSON(),
            },
        ],
        projectUuid,
        dashboards: [],
        access: [],
    },
];

export const spacesWithNoSavedCharts: Space[] = [
    {
        organizationUuid: user.organizationUuid!,
        name: 'sapce',
        uuid: 'uuid',
        pinnedListUuid: null,
        queries: [],
        projectUuid,
        isPrivate: false,
        dashboards: [],
        access: [],
    },
];

export const job: Job = {
    jobUuid: 'jobUuid',
    projectUuid: 'projectUuid',
    userUuid: user.userUuid,
    createdAt: new Date(),
    updatedAt: new Date(),
    jobStatus: JobStatusType.DONE,
    jobType: JobType.COMPILE_PROJECT,
    steps: [
        {
            jobUuid: 'jobUuid',
            createdAt: new Date(),
            updatedAt: new Date(),
            stepStatus: JobStepStatusType.DONE,
            stepType: JobStepType.COMPILING,
            stepError: undefined,
            stepDbtLogs: undefined,
            stepLabel: JobLabels[JobStepType.COMPILING],
            startedAt: new Date(),
        },
    ],
};

export const jobError: Job = {
    jobUuid: 'jobUuid',
    projectUuid: 'projectUuid',
    userUuid: user.userUuid,
    createdAt: new Date(),
    updatedAt: new Date(),
    jobStatus: JobStatusType.ERROR,
    jobType: JobType.COMPILE_PROJECT,
    steps: [
        {
            jobUuid: 'jobUuid',
            createdAt: new Date(),
            updatedAt: new Date(),
            stepStatus: JobStepStatusType.ERROR,
            stepType: JobStepType.COMPILING,
            stepError: 'Detailed error message',
            stepDbtLogs: undefined,
            stepLabel: JobLabels[JobStepType.COMPILING],
            startedAt: new Date(),
        },
    ],
};

export const lightdashConfigWithNoSMTP: Pick<
    LightdashConfig,
    'smtp' | 'siteUrl'
> = {
    smtp: undefined,
    siteUrl: 'https://test.lightdash.cloud',
};
