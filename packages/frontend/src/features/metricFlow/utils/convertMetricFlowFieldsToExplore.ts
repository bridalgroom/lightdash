import {
    CompiledDimension,
    CompiledMetric,
    DimensionType,
    Explore,
    fieldId,
    FieldType,
    friendlyName,
    MetricType,
    SupportedDbtAdapter,
} from '@lightdash/common';
import {
    GetMetricFlowFieldsResponse,
    MetricFlowDimensionType,
} from '../../../api/MetricFlowAPI';
import { convertDimensionNameToLabels } from './convertDimensionNameToLabels';

export default function convertMetricFlowFieldsToExplore(
    tableName: string,
    metricFlowFields: GetMetricFlowFieldsResponse,
) {
    const dimensionsMap = metricFlowFields.dimensions.reduce<
        Record<string, CompiledDimension>
    >((acc, { name, description, type, queryableGranularities }) => {
        const isTimeDimension = type === MetricFlowDimensionType.TIME;
        const labels = convertDimensionNameToLabels(name);
        const dimension: CompiledDimension = {
            fieldType: FieldType.DIMENSION,
            type: isTimeDimension
                ? DimensionType.TIMESTAMP
                : DimensionType.STRING,
            name: name,
            description,
            label: labels.dimensionLabel,
            table: tableName,
            tableLabel: labels.tableLabel ?? '',
            sql: '',
            compiledSql: '',
            tablesReferences: [tableName],
            hidden: false,
        };
        acc[fieldId(dimension)] = dimension;

        if (isTimeDimension && queryableGranularities) {
            queryableGranularities.forEach((timeGranularity) => {
                const timeDimension: CompiledDimension = {
                    fieldType: FieldType.DIMENSION,
                    type: DimensionType.TIMESTAMP,
                    // Note: time columns in results are suffixed with the time granularity eg:'__day'
                    name: `${name}__${timeGranularity
                        .toString()
                        .toLowerCase()}`,
                    description,
                    label: `${labels.dimensionLabel} (${friendlyName(
                        timeGranularity,
                    )})`,
                    table: tableName,
                    tableLabel: labels.tableLabel ?? '',
                    sql: '',
                    compiledSql: '',
                    tablesReferences: [tableName],
                    hidden: false,
                };
                acc[fieldId(timeDimension)] = timeDimension;
            });
        }

        return acc;
    }, {});
    const metricsMap = metricFlowFields.metricsForDimensions.reduce(
        (acc, { name, description }) => {
            const metric: CompiledMetric = {
                isAutoGenerated: false,
                fieldType: FieldType.METRIC,
                type: MetricType.NUMBER,
                name,
                description,
                label: friendlyName(name),
                table: tableName,
                tableLabel: '',
                sql: '',
                compiledSql: '',
                tablesReferences: [tableName],
                hidden: false,
            };

            return { ...acc, [fieldId(metric)]: metric };
        },
        {},
    );

    const explore: Explore = {
        name: tableName,
        label: '',
        tags: [],
        baseTable: tableName,
        joinedTables: [],
        tables: {
            [tableName]: {
                name: tableName,
                label: '',
                database: '',
                schema: '',
                sqlTable: '',
                dimensions: dimensionsMap,
                metrics: metricsMap,
                lineageGraph: {},
            },
        },
        targetDatabase: SupportedDbtAdapter.POSTGRES,
    };
    return explore;
}