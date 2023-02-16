/// <reference path="../@types/rudder-sdk-node.d.ts" />
import {
    CartesianSeriesType,
    ChartType,
    DbtProjectType,
    LightdashInstallType,
    LightdashUser,
    OrganizationMemberRole,
    PinnedItem,
    RequestMethod,
    TableSelectionType,
    WarehouseTypes,
} from '@lightdash/common';
import Analytics, {
    Track as AnalyticsTrack,
} from '@rudderstack/rudder-sdk-node';
import { v4 as uuidv4 } from 'uuid';
import { lightdashConfig } from '../config/lightdashConfig';
import { VERSION } from '../version';

type Identify = {
    userId: string;
    traits: {
        email?: string;
        first_name?: string;
        last_name?: string;
        is_tracking_anonymized: boolean;
        is_marketing_opted_in?: boolean;
    };
};
type BaseTrack = Omit<AnalyticsTrack, 'context'>;
type Group = {
    userId: string;
    groupId: string;
    traits: {
        name?: string;
    };
};
type TrackSimpleEvent = BaseTrack & {
    event:
        | 'password.updated'
        | 'invite_link.created'
        | 'invite_link.all_revoked'
        | 'password_reset_link.created'
        | 'password_reset_link.used'
        | 'personal_access_token.deleted';
};

type PersonalAccessTokenEvent = BaseTrack & {
    event: 'personal_access_token.created';
    properties: {
        userId: string;
        autoGenerated: boolean;
        method: RequestMethod;
    };
};

type DbtCloudIntegration = BaseTrack & {
    event: 'dbt_cloud_integration.updated' | 'dbt_cloud_integration.deleted';
    properties: {
        projectId: string;
    };
};

type SqlExecutedEvent = BaseTrack & {
    event: 'sql.executed';
    properties: {
        projectId: string;
    };
};

type LoginEvent = BaseTrack & {
    event: 'user.logged_in';
    properties: {
        loginProvider: 'password' | 'google';
    };
};

type IdentityLinkedEvent = BaseTrack & {
    event: 'user.identity_linked' | 'user.identity_removed';
    properties: {
        loginProvider: 'google';
    };
};

type CreateUserEvent = BaseTrack & {
    event: 'user.created';
    properties: {
        userConnectionType: 'password' | 'google';
    };
};

type DeleteUserEvent = BaseTrack & {
    event: 'user.deleted';
    properties: {
        firstName: string;
        lastName: string;
        email: string;
        organizationId: string;
    };
};

type UpdateUserEvent = BaseTrack & {
    event: 'user.updated';
    properties: LightdashUser & { jobTitle?: string };
};

type QueryExecutionEvent = BaseTrack & {
    event: 'query.executed';
    properties: {
        projectId: string;
        metricsCount: number;
        dimensionsCount: number;
        tableCalculationsCount: number;
        filtersCount: number;
        sortsCount: number;
        hasExampleMetric: boolean;
    };
};

type TrackOrganizationEvent = BaseTrack & {
    event:
        | 'organization.created'
        | 'organization.updated'
        | 'organization.deleted';
    properties: {
        type: string;
        organizationId: string;
        organizationName: string;
        defaultColourPaletteUpdated?: boolean;
    };
};

type TrackUserDeletedEvent = BaseTrack & {
    event: 'user.deleted';
    properties: {
        deletedUserUuid: string;
    };
};

type TrackSavedChart = BaseTrack & {
    event: 'saved_chart.updated' | 'saved_chart.deleted';
    properties: {
        projectId: string;
        savedQueryId: string;
    };
};

export type CreateSavedChartOrVersionEvent = BaseTrack & {
    event: 'saved_chart.created' | 'saved_chart_version.created';
    properties: {
        projectId: string;
        savedQueryId: string;
        dimensionsCount: number;
        metricsCount: number;
        filtersCount: number;
        sortsCount: number;
        tableCalculationsCount: number;
        pivotCount: number;
        chartType: ChartType;
        cartesian?: {
            xAxisCount: number;
            yAxisCount: number;
            seriesCount: number;
            seriesTypes: CartesianSeriesType[];
            referenceLinesCount: number;
            margins: string;
            showLegend: boolean;
        };
        table?: {
            conditionalFormattingRulesCount: number;
        };
        duplicated?: boolean;
    };
};

export type DuplicatedChartCreatedEvent = BaseTrack & {
    event: 'duplicated_chart_created';
    properties: {
        projectId: string;
        newSavedQueryId: string;
        duplicateOfSavedQueryId: string;
        dimensionsCount: number;
        metricsCount: number;
        filtersCount: number;
        sortsCount: number;
        tableCalculationsCount: number;
        pivotCount: number;
        chartType: ChartType;
        cartesian?: {
            xAxisCount: number;
            yAxisCount: number;
            seriesCount: number;
            seriesTypes: CartesianSeriesType[];
        };
    };
};

type ProjectEvent = BaseTrack & {
    event: 'project.updated' | 'project.created';
    userId: string;
    properties: {
        projectName: string;
        projectId: string;
        projectType: DbtProjectType;
        warehouseConnectionType: WarehouseTypes;
        organizationId: string;
        dbtConnectionType: DbtProjectType;
        isPreview: boolean;
        method: RequestMethod;
    };
};

type ProjectDeletedEvent = BaseTrack & {
    event: 'project.deleted';
    userId: string;
    properties: {
        projectId: string;
        isPreview: boolean;
    };
};

type ProjectTablesConfigurationEvent = BaseTrack & {
    event: 'project_tables_configuration.updated';
    userId: string;
    properties: {
        projectId: string;
        project_table_selection_type: TableSelectionType;
    };
};

type ProjectCompiledEvent = BaseTrack & {
    event: 'project.compiled';
    userId?: string;
    properties: {
        requestMethod: RequestMethod;
        projectId: string;
        projectName: string;
        projectType: DbtProjectType;
        warehouseType?: WarehouseTypes;
        modelsCount: number;
        modelsWithErrorsCount: number;
        metricsCount: number;
        packagesCount?: number;
        roundCount?: number;
        formattedFieldsCount?: number;
        urlsCount?: number;
    };
};

type ProjectErrorEvent = BaseTrack & {
    event: 'project.error';
    userId?: string;
    properties: {
        requestMethod: RequestMethod;
        projectId: string;
        name: string;
        statusCode: number;
        projectType: DbtProjectType;
    };
};

type DashboardEvent = BaseTrack & {
    event: 'dashboard.updated' | 'dashboard.deleted';
    userId: string;
    properties: {
        projectId: string;
        dashboardId: string;
    };
};

export type CreateDashboardOrVersionEvent = BaseTrack & {
    event: 'dashboard.created' | 'dashboard_version.created';
    properties: {
        projectId: string;
        dashboardId: string;
        filtersCount: number;
        tilesCount: number;
        chartTilesCount: number;
        markdownTilesCount: number;
        loomTilesCount: number;
        duplicated?: boolean;
    };
};

export type DuplicatedDashboardCreatedEvent = BaseTrack & {
    event: 'duplicated_dashboard_created';
    properties: {
        projectId: string;
        newDashboardId: string;
        duplicateOfDashboardId: string;
        filtersCount: number;
        tilesCount: number;
        chartTilesCount: number;
        markdownTilesCount: number;
        loomTilesCount: number;
    };
};

type ApiErrorEvent = BaseTrack & {
    event: 'api.error';
    userId?: string;
    anonymousId?: string;
    properties: {
        name: string;
        statusCode: number;
        route: string;
        method: string;
    };
};

type SpaceCreated = BaseTrack & {
    event: 'space.created';
    userId?: string;
    anonymousId?: string;
    properties: {
        name: string;
        spaceId: string;
        projectId: string;
    };
};
type SpaceUpdated = BaseTrack & {
    event: 'space.updated';
    userId?: string;
    anonymousId?: string;
    properties: {
        name: string;
        spaceId: string;
        projectId: string;
    };
};
type SpaceDeleted = BaseTrack & {
    event: 'space.deleted';
    userId?: string;
    anonymousId?: string;
    properties: {
        name: string;
        spaceId: string;
        projectId: string;
    };
};

type ProjectSearch = BaseTrack & {
    event: 'project.search';
    userId?: string;
    properties: {
        projectId: string;
        spacesResultsCount: number;
        dashboardsResultsCount: number;
        savedChartsResultsCount: number;
        tablesResultsCount: number;
        fieldsResultsCount: number;
    };
};
type DashboardUpdateMultiple = BaseTrack & {
    event: 'dashboard.updated_multiple';
    userId?: string;
    anonymousId?: string;
    properties: {
        dashboardIds: string[];
        projectId: string;
    };
};
type SavedChartUpdateMultiple = BaseTrack & {
    event: 'saved_chart.updated_multiple';
    userId?: string;
    anonymousId?: string;
    properties: {
        savedChartIds: string[];
        projectId: string;
    };
};

type PermissionsUpdated = BaseTrack & {
    event: 'permission.updated';
    userId?: string;
    anonymousId?: string;
    properties: {
        userId: string;
        userIdUpdated: string;
        organizationPermissions: OrganizationMemberRole;
        projectPermissions: any;
        newUser: boolean;
        generatedInvite: boolean;
    };
};

type FieldValueSearch = BaseTrack & {
    event: 'field_value.search';
    userId?: string;
    properties: {
        projectId: string;
        fieldId: string;
        searchCharCount: number;
        resultsCount: number;
        searchLimit: number;
    };
};

type ShareUrl = BaseTrack & {
    event: 'share_url.created' | 'share_url.used';
    userId: string;
    properties: {
        organizationId: string;
        path: string;
    };
};

type ShareSlack = BaseTrack & {
    event:
        | 'share_slack.unfurl'
        | 'share_slack.unfurl_completed'
        | 'share_slack.unfurl_error'
        | 'share_slack.install'
        | 'share_slack.install_error'
        | 'share_slack.delete';
    userId?: string;
    anonymousId?: string;
    properties: {
        pageType?: string;
        error?: string;
        organizationUuid?: string;
    };
};

type SavedChartView = BaseTrack & {
    event: 'saved_chart.view';
    userId: string;
    properties: {
        savedChartId: string;
        projectId: string;
        organizationId: string;
    };
};

type DashboardView = BaseTrack & {
    event: 'dashboard.view';
    userId: string;
    properties: {
        dashboardId: string;
        projectId: string;
        organizationId: string;
    };
};

type AnalyticsDashboardView = BaseTrack & {
    event: 'usage_analytics.dashboard_viewed';
    userId: string;
    properties: {
        projectId: string;
        organizationId: string;
        dashboardType: 'user_activity';
    };
};

type PinnedListUpdated = BaseTrack & {
    event: 'pinned_list.updated';
    userId: string;
    properties: {
        projectId: string;
        organizationId: string;
        location: 'homepage';
        pinnedListId: string;
        pinnedItems: PinnedItem[];
    };
};

export type SchedulerUpsertEvent = BaseTrack & {
    event: 'scheduler.created' | 'scheduler.updated';
    userId: string;
    properties: {
        projectId: string;
        organizationId: string;
        schedulerId: string;
        resourceType: 'dashboard' | 'chart';
        cronExpression: string;
        cronString: string;
        resourceId: string;
        targets: Array<{
            schedulerTargetId: string;
            type: 'slack' | 'email';
        }>;
    };
};

export type SchedulerDeleteEvent = BaseTrack & {
    event: 'scheduler.deleted';
    userId: string;
    properties: {
        projectId: string;
        organizationId: string;
        schedulerId: string;
        resourceType: 'dashboard' | 'chart';
        resourceId: string;
    };
};

export type SchedulerJobEvent = BaseTrack & {
    event:
        | 'scheduler_job.created'
        | 'scheduler_job.deleted'
        | 'scheduler_job.started'
        | 'scheduler_job.completed'
        | 'scheduler_job.failed';
    anonymousId: string;
    properties: {
        jobId: string;
        schedulerId: string;
        schedulerTargetId: string;
        resourceType?: 'dashboard' | 'chart';
        type: 'slack' | 'email';
    };
};

type Track =
    | TrackSimpleEvent
    | CreateUserEvent
    | UpdateUserEvent
    | DeleteUserEvent
    | QueryExecutionEvent
    | TrackSavedChart
    | CreateSavedChartOrVersionEvent
    | TrackUserDeletedEvent
    | ProjectErrorEvent
    | ApiErrorEvent
    | ProjectEvent
    | ProjectDeletedEvent
    | ProjectCompiledEvent
    | DashboardEvent
    | CreateDashboardOrVersionEvent
    | ProjectTablesConfigurationEvent
    | TrackOrganizationEvent
    | LoginEvent
    | IdentityLinkedEvent
    | SqlExecutedEvent
    | DbtCloudIntegration
    | PersonalAccessTokenEvent
    | DuplicatedChartCreatedEvent
    | DuplicatedDashboardCreatedEvent
    | ProjectSearch
    | SpaceCreated
    | SpaceUpdated
    | SpaceDeleted
    | DashboardUpdateMultiple
    | SavedChartUpdateMultiple
    | FieldValueSearch
    | PermissionsUpdated
    | ShareUrl
    | ShareSlack
    | SavedChartView
    | DashboardView
    | AnalyticsDashboardView
    | SchedulerUpsertEvent
    | SchedulerDeleteEvent
    | SchedulerJobEvent
    | PinnedListUpdated;

export class LightdashAnalytics extends Analytics {
    static lightdashContext = {
        app: {
            namespace: 'lightdash',
            name: 'lightdash_server',
            version: VERSION,
            mode: lightdashConfig.mode,
            installId: process.env.LIGHTDASH_INSTALL_ID || uuidv4(),
            installType:
                process.env.LIGHTDASH_INSTALL_TYPE ||
                LightdashInstallType.UNKNOWN,
        },
    };

    static anonymousId = process.env.LIGHTDASH_INSTALL_ID || uuidv4();

    identify(payload: Identify) {
        super.identify({
            ...payload,
            context: { ...LightdashAnalytics.lightdashContext }, // NOTE: spread because rudderstack manipulates arg
        });
    }

    track(payload: Track) {
        if (payload.event === 'user.updated') {
            const basicEventProperties = {
                is_tracking_anonymized: payload.properties.isTrackingAnonymized,
                is_marketing_opted_in: payload.properties.isMarketingOptedIn,
                job_title: payload.properties.jobTitle,
                is_setup_complete: payload.properties.isSetupComplete,
            };

            super.track({
                ...payload,
                event: `${LightdashAnalytics.lightdashContext.app.name}.${payload.event}`,
                context: { ...LightdashAnalytics.lightdashContext }, // NOTE: spread because rudderstack manipulates arg
                properties: payload.properties.isTrackingAnonymized
                    ? basicEventProperties
                    : {
                          ...basicEventProperties,
                          email: payload.properties.email,
                          first_name: payload.properties.firstName,
                          last_name: payload.properties.lastName,
                      },
            });
            return;
        }

        super.track({
            ...payload,
            event: `${LightdashAnalytics.lightdashContext.app.name}.${payload.event}`,
            context: { ...LightdashAnalytics.lightdashContext }, // NOTE: spread because rudderstack manipulates arg
        });
    }

    group(payload: Group) {
        super.group({
            ...payload,
            context: { ...LightdashAnalytics.lightdashContext }, // NOTE: spread because rudderstack manipulates arg
        });
    }
}
