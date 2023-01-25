import {
    AdditionalMetric,
    CompiledMetric,
    CompiledMetricQuery,
    CompiledTableCalculation,
    CompileError,
    compileMetricSql,
    convertAdditionalMetric,
    Explore,
    FieldId,
    lightdashVariablePattern,
    MetricQuery,
    TableCalculation,
    WarehouseClient,
} from '@lightdash/common';

const resolveQueryFieldReference = (ref: string): FieldId => {
    const parts = ref.split('.');
    if (parts.length !== 2) {
        throw new CompileError(
            `Table calculation contains an invalid reference: ${ref}. References must be of the format "table.field"`,
            {},
        );
    }
    const [tableName, fieldName] = parts;
    const fieldId = `${tableName}_${fieldName}`;

    return fieldId;
};

const compileTableCalculation = (
    tableCalculation: TableCalculation,
    validFieldIds: string[],
    quoteChar: string,
): CompiledTableCalculation => {
    if (validFieldIds.includes(tableCalculation.name)) {
        throw new CompileError(
            `Table calculation has a name that already exists in the query: ${tableCalculation.name}`,
            {},
        );
    }
    const compiledSql = tableCalculation.sql.replace(
        lightdashVariablePattern,
        (_, p1) => {
            const fieldId = resolveQueryFieldReference(p1);
            if (validFieldIds.includes(fieldId)) {
                return `${quoteChar}${fieldId}${quoteChar}`;
            }
            throw new CompileError(
                `Table calculation contains a reference ${p1} to a field that isn't included in the query.`,
                {},
            );
        },
    );
    return {
        ...tableCalculation,
        compiledSql,
    };
};

type CompileAdditionalMetricArgs = {
    additionalMetric: AdditionalMetric;
    explore: Pick<Explore, 'tables' | 'targetDatabase'>;

    warehouseClient: WarehouseClient;
};
const compileAdditionalMetric = ({
    additionalMetric,
    explore,
    warehouseClient,
}: CompileAdditionalMetricArgs): CompiledMetric => {
    const table = explore.tables[additionalMetric.table];
    if (table === undefined) {
        throw new CompileError(
            `Custom metric "${additionalMetric.name}" references a table that doesn't exist "${additionalMetric.table}"`,
            {},
        );
    }
    const fieldQuoteChar = warehouseClient.getFieldQuoteChar();
    const stringQuoteChar = warehouseClient.getStringQuoteChar();
    const escapeStringQuoteChar = warehouseClient.getEscapeStringQuoteChar();

    const metric = convertAdditionalMetric({ additionalMetric, table });
    const compiledMetric = compileMetricSql(
        metric,
        explore.tables,
        fieldQuoteChar,
        stringQuoteChar,
        escapeStringQuoteChar,
        explore.targetDatabase,
    );
    return {
        ...metric,
        compiledSql: compiledMetric.sql,
        tablesReferences: Array.from(compiledMetric.tablesReferences),
    };
};

type CompileMetricQueryArgs = {
    explore: Pick<Explore, 'targetDatabase' | 'tables'>;
    metricQuery: MetricQuery;

    warehouseClient: WarehouseClient;
};
export const compileMetricQuery = ({
    explore,
    metricQuery,
    warehouseClient,
}: CompileMetricQueryArgs): CompiledMetricQuery => {
    const fieldQuoteChar = warehouseClient.getFieldQuoteChar();
    const compiledTableCalculations = metricQuery.tableCalculations.map(
        (tableCalculation) =>
            compileTableCalculation(
                tableCalculation,
                [...metricQuery.dimensions, ...metricQuery.metrics],
                fieldQuoteChar,
            ),
    );
    const compiledAdditionalMetrics = (metricQuery.additionalMetrics || []).map(
        (additionalMetric) =>
            compileAdditionalMetric({
                additionalMetric,
                explore,
                warehouseClient,
            }),
    );
    return {
        ...metricQuery,
        compiledTableCalculations,
        compiledAdditionalMetrics,
    };
};
