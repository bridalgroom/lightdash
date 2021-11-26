import {
    CompiledMetricQuery,
    DimensionType,
    Explore,
    FieldType,
    MetricType,
    SupportedDbtAdapter,
} from 'common';

export const EXPLORE: Explore = {
    targetDatabase: SupportedDbtAdapter.POSTGRES,
    name: 'table1',
    baseTable: 'table1',
    tags: [],
    joinedTables: [
        {
            table: 'table2',
            sqlOn: '${table1.shared} = ${table2.shared}',
            compiledSqlOn: '(table1.shared) = (table2.shared)',
        },
    ],
    tables: {
        table1: {
            name: 'table1',
            database: 'database',
            schema: 'schema',
            sqlTable: '"db"."schema"."table1"',
            dimensions: {
                dim1: {
                    type: DimensionType.NUMBER,
                    name: 'dim1',
                    table: 'table1',
                    fieldType: FieldType.DIMENSION,
                    sql: '${TABLE}.dim1',
                    compiledSql: 'table1.dim1',
                },
                shared: {
                    type: DimensionType.STRING,
                    name: 'shared',
                    table: 'table1',
                    fieldType: FieldType.DIMENSION,
                    sql: '${TABLE}.shared',
                    compiledSql: 'table1.shared',
                },
            },
            metrics: {
                metric1: {
                    type: MetricType.MAX,
                    fieldType: FieldType.METRIC,
                    table: 'table1',
                    name: 'metric1',
                    sql: '${TABLE}.number_column',
                    compiledSql: 'MAX(table1.number_column)',
                    isAutoGenerated: false,
                },
            },
            lineageGraph: {},
        },
        table2: {
            name: 'table2',
            database: 'database',
            schema: 'schema',
            sqlTable: '"db"."schema"."table2"',
            dimensions: {
                dim2: {
                    type: DimensionType.NUMBER,
                    name: 'dim2',
                    table: 'table2',
                    fieldType: FieldType.DIMENSION,
                    sql: '${TABLE}.dim2',
                    compiledSql: 'table1.dim2',
                },
                shared: {
                    type: DimensionType.STRING,
                    name: 'shared',
                    table: 'table2',
                    fieldType: FieldType.DIMENSION,
                    sql: '${TABLE}.shared',
                    compiledSql: 'table2.shared',
                },
            },
            metrics: {
                metric2: {
                    type: MetricType.MAX,
                    fieldType: FieldType.METRIC,
                    table: 'table2',
                    name: 'metric2',
                    sql: '${TABLE}.number_column',
                    compiledSql: 'MAX(table2.number_column)',
                    isAutoGenerated: false,
                },
            },
            lineageGraph: {},
        },
    },
};

export const METRIC_QUERY: CompiledMetricQuery = {
    dimensions: ['table1_dim1'],
    metrics: ['table1_metric1'],
    filters: [],
    sorts: [{ fieldId: 'table1_metric1', descending: true }],
    limit: 10,
    tableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
        },
    ],
    compiledTableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
            compiledSql: 'table1_dim1 + table1_metric1',
        },
    ],
};

export const METRIC_QUERY_TWO_TABLES: CompiledMetricQuery = {
    dimensions: ['table1_dim1'],
    metrics: ['table2_metric2'],
    filters: [],
    sorts: [{ fieldId: 'table2_metric2', descending: true }],
    limit: 10,
    tableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table2.metric2}',
        },
    ],
    compiledTableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table2.metric2}',
            compiledSql: 'table1_dim1 + table2_metric2',
        },
    ],
};

export const METRIC_QUERY_SQL = `WITH metrics AS (
SELECT
  table1.dim1 AS "table1_dim1",
  MAX(table1.number_column) AS "table1_metric1"
FROM "db"."schema"."table1" AS table1


GROUP BY 1
)
SELECT
  *,
  table1_dim1 + table1_metric1 AS "calc3"
FROM metrics
ORDER BY "table1_metric1" DESC
LIMIT 10`;

export const METRIC_QUERY_TWO_TABLES_SQL = `WITH metrics AS (
SELECT
  table1.dim1 AS "table1_dim1",
  MAX(table2.number_column) AS "table2_metric2"
FROM "db"."schema"."table1" AS table1
LEFT JOIN "db"."schema"."table2" AS table2
  ON (table1.shared) = (table2.shared)

GROUP BY 1
)
SELECT
  *,
  table1_dim1 + table2_metric2 AS "calc3"
FROM metrics
ORDER BY "table2_metric2" DESC
LIMIT 10`;
