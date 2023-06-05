import { subject } from '@casl/ability';
import {
    CompiledField,
    CreateChartValidation,
    CreateDashboardValidation,
    CreateTableValidation,
    CreateValidation,
    Explore,
    ExploreError,
    fieldId as getFieldId,
    ForbiddenError,
    getFilterRules,
    InlineErrorType,
    isDashboardChartTileType,
    isDimension,
    isExploreError,
    isMetric,
    OrganizationMemberRole,
    RequestMethod,
    SessionUser,
    TableCalculation,
    ValidationErrorType,
    ValidationResponse,
} from '@lightdash/common';
import { analytics } from '../../analytics/client';
import { schedulerClient } from '../../clients/clients';
import { LightdashConfig } from '../../config/parseConfig';
import Logger from '../../logger';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { SpaceModel } from '../../models/SpaceModel';
import { ValidationModel } from '../../models/ValidationModel/ValidationModel';
import { hasSpaceAccess } from '../SpaceService/SpaceService';

type ServiceDependencies = {
    lightdashConfig: LightdashConfig;
    validationModel: ValidationModel;
    projectModel: ProjectModel;
    savedChartModel: SavedChartModel;
    dashboardModel: DashboardModel;
    spaceModel: SpaceModel;
};

export class ValidationService {
    lightdashConfig: LightdashConfig;

    validationModel: ValidationModel;

    projectModel: ProjectModel;

    savedChartModel: SavedChartModel;

    dashboardModel: DashboardModel;

    spaceModel: SpaceModel;

    constructor({
        lightdashConfig,
        validationModel,
        projectModel,
        savedChartModel,
        dashboardModel,
        spaceModel,
    }: ServiceDependencies) {
        this.lightdashConfig = lightdashConfig;
        this.projectModel = projectModel;
        this.savedChartModel = savedChartModel;
        this.validationModel = validationModel;
        this.dashboardModel = dashboardModel;
        this.spaceModel = spaceModel;
    }

    private static getTableCalculationFieldIds(
        tableCalculations: TableCalculation[],
    ): string[] {
        const parseTableField = (field: string) =>
            // Transform ${table.field} references on table calculation to table_field
            field.replace('${', '').replace('}', '').replace('.', '_');

        const tableCalculationFieldsInSql: string[] = tableCalculations.reduce<
            string[]
        >((acc, tc) => {
            const regex = /\$\{([^}]+)\}/g;

            const fieldsInSql = tc.sql.match(regex);
            if (fieldsInSql != null) {
                return [...acc, ...fieldsInSql.map(parseTableField)];
            }
            return acc;
        }, []);
        return tableCalculationFieldsInSql;
    }

    private static async validateTables(
        projectUuid: string,
        explores: (Explore | ExploreError)[] | undefined,
    ): Promise<CreateTableValidation[]> {
        // Get existing errors from ExploreError and convert to ValidationInsert
        if (explores === undefined) {
            return [];
        }
        const errors = explores.reduce<CreateTableValidation[]>(
            (acc, explore) => {
                if (isExploreError(explore)) {
                    const exploreErrors = explore.errors
                        .filter(
                            (error) =>
                                error.type !==
                                InlineErrorType.NO_DIMENSIONS_FOUND,
                        )
                        .map((ee) => ({
                            name: explore.name,
                            error: ee.message,
                            errorType: ValidationErrorType.Model,
                            modelName: explore.name,
                            projectUuid,
                        }));
                    return [...acc, ...exploreErrors];
                }
                return acc;
            },
            [],
        );
        return errors;
    }

    private async validateCharts(
        projectUuid: string,
        existingFields: CompiledField[],
    ): Promise<CreateChartValidation[]> {
        const existingFieldIds = existingFields.map(getFieldId);

        const existingDimensionIds = existingFields
            .filter(isDimension)
            .map(getFieldId);
        const existingMetricIds = existingFields
            .filter(isMetric)
            .map(getFieldId);
        const chartSummaries = await this.savedChartModel.find({ projectUuid });
        const charts = await Promise.all(
            chartSummaries.map((chartSummary) =>
                this.savedChartModel.get(chartSummary.uuid),
            ),
        );

        const results = charts.flatMap((chart) => {
            const filterAdditionalMetrics = (metric: string) =>
                !chart.metricQuery.additionalMetrics
                    ?.map((additionalMetric) => getFieldId(additionalMetric))
                    ?.includes(metric);

            const commonValidation = {
                chartUuid: chart.uuid,
                name: chart.name,
                projectUuid: chart.projectUuid,
            };
            const containsFieldId = ({
                acc,
                fieldIds,
                fieldId,
                error,
                errorType,
                fieldName,
            }: {
                acc: CreateChartValidation[];
                fieldIds: string[];
                fieldId: string;
            } & Pick<
                CreateChartValidation,
                'error' | 'errorType' | 'fieldName'
            >) => {
                if (!fieldIds?.includes(fieldId)) {
                    return [
                        ...acc,
                        {
                            ...commonValidation,
                            errorType,
                            error,
                            fieldName,
                        },
                    ];
                }
                return acc;
            };

            const dimensionErrors = chart.metricQuery.dimensions.reduce<
                CreateChartValidation[]
            >(
                (acc, field) =>
                    containsFieldId({
                        acc,
                        fieldIds: existingDimensionIds,
                        fieldId: field,
                        error: `Dimension error: the field '${field}' no longer exists`,
                        errorType: ValidationErrorType.Dimension,
                        fieldName: field,
                    }),
                [],
            );
            const metricErrors = chart.metricQuery.metrics
                .filter(filterAdditionalMetrics)
                .reduce<CreateChartValidation[]>(
                    (acc, field) =>
                        containsFieldId({
                            acc,
                            fieldIds: existingMetricIds,
                            fieldId: field,
                            error: `Metric error: the field '${field}' no longer exists`,
                            errorType: ValidationErrorType.Metric,
                            fieldName: field,
                        }),
                    [],
                );

            const filterTableCalculations = (fieldId: string) =>
                !chart.metricQuery.tableCalculations
                    ?.map((tableCalculation) => tableCalculation.name)
                    ?.includes(fieldId);

            const filterErrors = getFilterRules(
                chart.metricQuery.filters,
            ).reduce<CreateChartValidation[]>(
                (acc, field) =>
                    containsFieldId({
                        acc,
                        fieldIds: existingFieldIds,
                        fieldId: field.target.fieldId,
                        error: `Filter error: the field '${field.target.fieldId}' no longer exists`,
                        errorType: ValidationErrorType.Filter,
                        fieldName: field.target.fieldId,
                    }),
                [],
            );

            const sortErrors = chart.metricQuery.sorts
                .filter(
                    (sort) =>
                        filterTableCalculations(sort.fieldId) &&
                        filterAdditionalMetrics(sort.fieldId),
                )
                .reduce<CreateChartValidation[]>(
                    (acc, field) =>
                        containsFieldId({
                            acc,
                            fieldIds: existingFieldIds,
                            fieldId: field.fieldId,
                            error: `Sorting error: the field '${field.fieldId}' no longer exists`,
                            errorType: ValidationErrorType.Sorting,
                            fieldName: field.fieldId,
                        }),
                    [],
                );

            /*
            // I think these are redundant, as we already check dimension/metrics


            const errorColumnOrder = chart.tableConfig.columnOrder
                .filter(filterTableCalculations)
                .filter(filterAdditionalMetrics)
                .reduce<ValidationResponse[]>((acc, field) => {
                    return containsFieldId(acc, existingFieldIds, field,
                        `Table error: the field '${field}' no longer exists`,
                        `The field '${field}' no longer exists and is being used to order table columns.`)
                }, []);


            const tableCalculationErrors =
                ValidationService.getTableCalculationFieldIds(
                    chart.metricQuery.tableCalculations,
                ).reduce<ValidationResponse[]>(
                    (acc, field) =>
                        containsFieldId(
                            acc,
                            existingFieldIds,
                            field,
                            `Table calculation error: the field '${field}' no longer exists`,
                            `The field '${field}' no longer exists and is being used as a table calculation.`,
                        ),
                    [],
                ); */

            return [
                ...dimensionErrors,
                ...metricErrors,
                ...filterErrors,
                ...sortErrors,
            ];
        });

        return results;
    }

    private async validateDashboards(
        projectUuid: string,
        existingFields: CompiledField[],
        brokenCharts: Pick<CreateChartValidation, 'chartUuid' | 'name'>[],
    ): Promise<CreateDashboardValidation[]> {
        const existingFieldIds = existingFields.map(getFieldId);

        const dashboardSummaries = await this.dashboardModel.getAllByProject(
            projectUuid,
        );
        const dashboards = await Promise.all(
            dashboardSummaries.map((dashboardSummary) =>
                this.dashboardModel.getById(dashboardSummary.uuid),
            ),
        );
        const results: CreateDashboardValidation[] = dashboards.flatMap(
            (dashboard) => {
                const commonValidation = {
                    name: dashboard.name,
                    dashboardUuid: dashboard.uuid,
                    projectUuid: dashboard.projectUuid,
                };

                const containsFieldId = ({
                    acc,
                    fieldIds,
                    fieldId,
                    error,
                    errorType,
                    fieldName,
                }: {
                    acc: CreateDashboardValidation[];
                    fieldIds: string[];
                    fieldId: string;
                } & Pick<
                    CreateDashboardValidation,
                    'error' | 'errorType' | 'fieldName'
                >) => {
                    if (!fieldIds?.includes(fieldId)) {
                        return [
                            ...acc,
                            {
                                ...commonValidation,
                                errorType,
                                error,
                                fieldName,
                            },
                        ];
                    }
                    return acc;
                };

                const dashboardFilterRules = [
                    ...dashboard.filters.dimensions,
                    ...dashboard.filters.metrics,
                ];
                const filterErrors = dashboardFilterRules.reduce<
                    CreateDashboardValidation[]
                >(
                    (acc, filter) =>
                        containsFieldId({
                            acc,
                            fieldIds: existingFieldIds,
                            fieldId: filter.target.fieldId,
                            error: `Filter error: the field '${filter.target.fieldId}' no longer exists`,
                            errorType: ValidationErrorType.Filter,
                            fieldName: filter.target.fieldId,
                        }),
                    [],
                );

                const chartTiles = dashboard.tiles.filter(
                    isDashboardChartTileType,
                );
                const chartErrors = chartTiles.reduce<
                    CreateDashboardValidation[]
                >((acc, chart) => {
                    const brokenChart = brokenCharts.find(
                        (c) => c.chartUuid === chart.properties.savedChartUuid,
                    );
                    if (brokenChart !== undefined) {
                        return [
                            ...acc,
                            {
                                ...commonValidation,
                                error: `The chart '${brokenChart.name}' is broken on this dashboard.`,
                                errorType: ValidationErrorType.Chart,
                                chartName: brokenChart.name,
                            },
                        ];
                    }
                    return acc;
                }, []);

                return [...filterErrors, ...chartErrors];
            },
        );

        return results;
    }

    async generateValidation(projectUuid: string): Promise<CreateValidation[]> {
        const explores = await this.projectModel.getExploresFromCache(
            projectUuid,
        );

        const existingFields = explores?.reduce<CompiledField[]>(
            (acc, explore) => {
                if (!explore.tables) return acc;

                const fields = Object.values(explore.tables).flatMap(
                    (table) => [
                        ...Object.values(table.dimensions),
                        ...Object.values(table.metrics),
                    ],
                );

                return [...acc, ...fields];
            },
            [],
        );

        if (!existingFields) {
            Logger.warn(
                `No fields found for project validation ${projectUuid}`,
            );
            return [];
        }

        const tableErrors = await ValidationService.validateTables(
            projectUuid,
            explores,
        );
        const chartErrors = await this.validateCharts(
            projectUuid,
            existingFields,
        );
        const dashboardErrors = await this.validateDashboards(
            projectUuid,
            existingFields,
            chartErrors,
        );
        const validationErrors = [
            ...tableErrors,
            ...chartErrors,
            ...dashboardErrors,
        ];

        return validationErrors;
    }

    async validate(
        user: SessionUser,
        projectUuid: string,
        context?: RequestMethod,
    ): Promise<string> {
        const { organizationUuid } = await this.projectModel.get(projectUuid);

        if (
            user.ability.cannot(
                'manage',
                subject('Validation', {
                    organizationUuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }

        const fromCLI =
            context === RequestMethod.CLI_CI || context === RequestMethod.CLI;
        const jobId = await schedulerClient.generateValidation({
            userUuid: user.userUuid,
            projectUuid,
            context: fromCLI ? 'cli' : 'lightdash_app',
            organizationUuid: user.organizationUuid,
        });
        return jobId;
    }

    async storeValidation(
        projectUuid: string,
        validationErrors: CreateValidation[],
    ) {
        await this.validationModel.delete(projectUuid);

        if (validationErrors.length > 0)
            await this.validationModel.create(validationErrors);
    }

    async hidePrivateContent(
        user: SessionUser,
        projectUuid: string,
        validations: ValidationResponse[],
    ): Promise<ValidationResponse[]> {
        if (user.role === OrganizationMemberRole.ADMIN) return validations;

        const spaces = await this.spaceModel.find({ projectUuid });
        // Filter private content to developers
        return validations.map((validation) => {
            const space = spaces.find((s) => s.uuid === validation.spaceUuid);
            const hasAccess = space && hasSpaceAccess(user, space);
            if (hasAccess) return validation;

            return {
                ...validation,
                chartUuid: undefined,
                dashboardUuid: undefined,
                name: 'Private content',
            };
        });
    }

    async get(
        user: SessionUser,
        projectUuid: string,
        fromSettings = false,
    ): Promise<ValidationResponse[]> {
        const { organizationUuid } = await this.projectModel.get(projectUuid);

        if (
            user.ability.cannot(
                'manage',
                subject('Validation', {
                    organizationUuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        const validations = await this.validationModel.get(projectUuid);

        if (fromSettings) {
            const contentIds = validations.map(
                (validation) =>
                    // NOTE: chart and dashboard uuids might be undefined for private content, so default to name if not present
                    ('chartUuid' in validation && validation.chartUuid) ||
                    ('dashboardUuid' in validation &&
                        validation.dashboardUuid) ||
                    validation.name,
            );

            analytics.track({
                event: 'validation.page_viewed',
                userId: user.userUuid,
                properties: {
                    organizationId: organizationUuid,
                    projectId: projectUuid,
                    numErrorsDetected: validations.length,
                    numContentAffected: new Set(contentIds).size,
                },
            });
        }

        return this.hidePrivateContent(user, projectUuid, validations);
    }

    async getJob(
        user: SessionUser,
        projectUuid: string,
    ): Promise<ValidationResponse[]> {
        const validations = await this.validationModel.get(projectUuid);
        return this.hidePrivateContent(user, projectUuid, validations);
    }
}
