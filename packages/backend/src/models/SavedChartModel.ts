import {
    ChartConfig,
    CreateSavedChart,
    CreateSavedChartVersion,
    DBFieldTypes,
    SavedChart,
    SortField,
    Space,
    UpdateSavedChart,
} from 'common';
import { Knex } from 'knex';
import {
    CreateDbSavedChartVersionField,
    CreateDbSavedChartVersionSort,
    DbSavedChartAdditionalMetricInsert,
    DbSavedChartTableCalculationInsert,
    SavedChartAdditionalMetricTableName,
} from '../database/entities/savedCharts';
import { getSpace, getSpaceWithQueries } from '../database/entities/spaces';
import { NotFoundError } from '../errors';

type DbSavedChartDetails = {
    project_uuid: string;
    saved_query_id: number;
    saved_query_uuid: string;
    name: string;
    saved_queries_version_id: number;
    explore_name: string;
    filters: any;
    row_limit: number;
    chart_type: ChartConfig['type'];
    chart_config: ChartConfig['config'] | undefined;
    pivot_dimensions: string[] | undefined;
    created_at: Date;
};

const createSavedChartVersionField = async (
    trx: Knex,
    data: CreateDbSavedChartVersionField,
) => {
    const results = await trx('saved_queries_version_fields')
        .insert<CreateDbSavedChartVersionField>(data)
        .returning('*');
    return results[0];
};

const createSavedChartVersionSort = async (
    trx: Knex,
    data: CreateDbSavedChartVersionSort,
) => {
    const results = await trx('saved_queries_version_sorts')
        .insert<CreateDbSavedChartVersionSort>(data)
        .returning('*');
    return results[0];
};

const createSavedChartVersionTableCalculation = async (
    trx: Knex,
    data: DbSavedChartTableCalculationInsert,
) => {
    const results = await trx('saved_queries_version_table_calculations')
        .insert(data)
        .returning('*');
    return results[0];
};

const createSavedChartVersionAdditionalMetrics = async (
    trx: Knex,
    data: DbSavedChartAdditionalMetricInsert,
) => {
    const results = await trx(SavedChartAdditionalMetricTableName)
        .insert(data)
        .returning('*');
    return results[0];
};

const createSavedChartVersion = async (
    db: Knex,
    savedChartId: number,
    {
        tableName,
        metricQuery: {
            limit,
            filters,
            dimensions,
            metrics,
            sorts,
            tableCalculations,
            additionalMetrics,
        },
        chartConfig,
        tableConfig,
        pivotConfig,
    }: CreateSavedChartVersion,
): Promise<void> => {
    await db.transaction(async (trx) => {
        try {
            const [version] = await trx('saved_queries_versions')
                .insert({
                    row_limit: limit,
                    filters: JSON.stringify(filters),
                    explore_name: tableName,
                    saved_query_id: savedChartId,
                    pivot_dimensions: pivotConfig
                        ? pivotConfig.columns
                        : undefined,
                    chart_type: chartConfig.type,
                    chart_config: chartConfig.config,
                })
                .returning('*');
            const promises: Promise<any>[] = [];
            dimensions.forEach((dimension) => {
                promises.push(
                    createSavedChartVersionField(trx, {
                        name: dimension,
                        field_type: DBFieldTypes.DIMENSION,
                        saved_queries_version_id:
                            version.saved_queries_version_id,
                        order: tableConfig.columnOrder.findIndex(
                            (column) => column === dimension,
                        ),
                    }),
                );
            });
            metrics.forEach((metric) => {
                promises.push(
                    createSavedChartVersionField(trx, {
                        name: metric,
                        field_type: DBFieldTypes.METRIC,
                        saved_queries_version_id:
                            version.saved_queries_version_id,
                        order: tableConfig.columnOrder.findIndex(
                            (column) => column === metric,
                        ),
                    }),
                );
            });
            sorts.forEach((sort, index) => {
                promises.push(
                    createSavedChartVersionSort(trx, {
                        field_name: sort.fieldId,
                        descending: sort.descending,
                        saved_queries_version_id:
                            version.saved_queries_version_id,
                        order: index,
                    }),
                );
            });
            tableCalculations.forEach((tableCalculation, index) => {
                promises.push(
                    createSavedChartVersionTableCalculation(trx, {
                        name: tableCalculation.name,
                        display_name: tableCalculation.displayName,
                        calculation_raw_sql: tableCalculation.sql,
                        saved_queries_version_id:
                            version.saved_queries_version_id,
                        order: tableConfig.columnOrder.findIndex(
                            (column) => column === tableCalculation.name,
                        ),
                    }),
                );
            });
            additionalMetrics?.forEach((additionalMetric, index) => {
                promises.push(
                    createSavedChartVersionAdditionalMetrics(trx, {
                        table: additionalMetric.table,
                        name: additionalMetric.name,
                        type: additionalMetric.type,
                        label: additionalMetric.label,
                        description: additionalMetric.description,
                        sql: additionalMetric.sql,
                        hidden: additionalMetric.hidden,
                        round: additionalMetric.round,
                        format: additionalMetric.format,
                        saved_queries_version_id:
                            version.saved_queries_version_id,
                    }),
                );
            });
            await Promise.all(promises);
        } catch (e) {
            await trx.rollback(e);
            throw e;
        }
    });
};

type Dependencies = {
    database: Knex;
};
export class SavedChartModel {
    private database: Knex;

    constructor(dependencies: Dependencies) {
        this.database = dependencies.database;
    }

    // eslint-disable-next-line class-methods-use-this
    async getAllSpaces(projectUuid: string): Promise<Space[]> {
        const space = await getSpaceWithQueries(projectUuid);
        return [space];
    }

    async create(
        projectUuid: string,
        {
            name,
            tableName,
            metricQuery,
            chartConfig,
            tableConfig,
            pivotConfig,
        }: CreateSavedChart,
    ): Promise<SavedChart> {
        const newSavedChartUuid = await this.database.transaction(
            async (trx) => {
                try {
                    const space = await getSpace(trx, projectUuid);
                    const [newSavedChart] = await trx('saved_queries')
                        .insert({ name, space_id: space.space_id })
                        .returning('*');
                    await createSavedChartVersion(
                        trx,
                        newSavedChart.saved_query_id,
                        {
                            tableName,
                            metricQuery,
                            chartConfig,
                            tableConfig,
                            pivotConfig,
                        },
                    );
                    return newSavedChart.saved_query_uuid;
                } catch (e) {
                    await trx.rollback(e);
                    throw e;
                }
            },
        );
        return this.get(newSavedChartUuid);
    }

    async createVersion(
        savedChartUuid: string,
        data: CreateSavedChartVersion,
    ): Promise<SavedChart> {
        await this.database.transaction(async (trx) => {
            try {
                const [savedChart] = await trx('saved_queries')
                    .select(['saved_query_id'])
                    .where('saved_query_uuid', savedChartUuid);
                await createSavedChartVersion(
                    trx,
                    savedChart.saved_query_id,
                    data,
                );
            } catch (e) {
                trx.rollback(e);
                throw e;
            }
        });
        return this.get(savedChartUuid);
    }

    async update(
        savedChartUuid: string,
        data: UpdateSavedChart,
    ): Promise<SavedChart> {
        await this.database('saved_queries')
            .update<UpdateSavedChart>(data)
            .where('saved_query_uuid', savedChartUuid);
        return this.get(savedChartUuid);
    }

    async delete(savedChartUuid: string): Promise<SavedChart> {
        const savedChart = await this.get(savedChartUuid);
        await this.database('saved_queries')
            .delete()
            .where('saved_query_uuid', savedChartUuid);
        return savedChart;
    }

    async get(savedChartUuid: string): Promise<SavedChart> {
        const [savedQuery] = await this.database<DbSavedChartDetails>(
            'saved_queries',
        )
            .innerJoin('spaces', 'saved_queries.space_id', 'spaces.space_id')
            .innerJoin('projects', 'spaces.project_id', 'projects.project_id')
            .innerJoin(
                'saved_queries_versions',
                'saved_queries.saved_query_id',
                'saved_queries_versions.saved_query_id',
            )
            .select<DbSavedChartDetails[]>([
                'projects.project_uuid',
                'saved_queries.saved_query_id',
                'saved_queries.saved_query_uuid',
                'saved_queries.name',
                'saved_queries_versions.saved_queries_version_id',
                'saved_queries_versions.explore_name',
                'saved_queries_versions.filters',
                'saved_queries_versions.row_limit',
                'saved_queries_versions.chart_type',
                'saved_queries_versions.created_at',
                'saved_queries_versions.chart_config',
                'saved_queries_versions.pivot_dimensions',
            ])
            .where('saved_query_uuid', savedChartUuid)
            .orderBy('saved_queries_versions.created_at', 'desc')
            .limit(1);
        if (savedQuery === undefined) {
            throw new NotFoundError('Saved query not found');
        }
        const fields = await this.database('saved_queries_version_fields')
            .select(['name', 'field_type', 'order'])
            .where(
                'saved_queries_version_id',
                savedQuery.saved_queries_version_id,
            )
            .orderBy('order', 'asc');
        const sorts = await this.database('saved_queries_version_sorts')
            .select(['field_name', 'descending'])
            .where(
                'saved_queries_version_id',
                savedQuery.saved_queries_version_id,
            )
            .orderBy('order', 'asc');
        const tableCalculations = await this.database(
            'saved_queries_version_table_calculations',
        )
            .select(['name', 'display_name', 'calculation_raw_sql', 'order'])
            .where(
                'saved_queries_version_id',
                savedQuery.saved_queries_version_id,
            );
        const additionalMetrics = await this.database(
            SavedChartAdditionalMetricTableName,
        )
            .select([
                'table',
                'name',
                'type',
                'label',
                'description',
                'sql',
                'hidden',
                'round',
                'format',
            ])
            .where(
                'saved_queries_version_id',
                savedQuery.saved_queries_version_id,
            );

        // Filters out "null" fields
        const additionalMetricsFiltered = additionalMetrics.map((addMetric) => Object.keys(addMetric).reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: addMetric[key] !== null ? addMetric[key] : undefined,
                }),
                { ...addMetric },
            ));

        const [dimensions, metrics]: [string[], string[]] = fields.reduce<
            [string[], string[]]
        >(
            (result, field) => {
                result[
                    field.field_type === DBFieldTypes.DIMENSION ? 0 : 1
                ].push(field.name);
                return result;
            },
            [[], []],
        );

        const columnOrder: string[] = [...fields, ...tableCalculations]
            .sort((a, b) => a.order - b.order)
            .map((x) => x.name);

        const chartConfig = {
            type: savedQuery.chart_type,
            config: savedQuery.chart_config,
        } as ChartConfig;

        return {
            uuid: savedQuery.saved_query_uuid,
            projectUuid: savedQuery.project_uuid,
            name: savedQuery.name,
            tableName: savedQuery.explore_name,
            updatedAt: savedQuery.created_at,
            metricQuery: {
                dimensions,
                metrics,
                filters: savedQuery.filters,
                sorts: sorts.map<SortField>((sort) => ({
                    fieldId: sort.field_name,
                    descending: sort.descending,
                })),
                limit: savedQuery.row_limit,
                tableCalculations: tableCalculations.map(
                    (tableCalculation) => ({
                        name: tableCalculation.name,
                        displayName: tableCalculation.display_name,
                        sql: tableCalculation.calculation_raw_sql,
                    }),
                ),
                additionalMetrics: additionalMetricsFiltered,
            },
            chartConfig,
            tableConfig: {
                columnOrder,
            },
            ...(savedQuery.pivot_dimensions
                ? { pivotConfig: { columns: savedQuery.pivot_dimensions } }
                : {}),
        };
    }
}
