import { Colors } from '@blueprintjs/core';
import {
    ApiQueryResults,
    Field,
    formatItemValue,
    hashFieldReference,
    PivotReference,
    ResultRow,
    TableCalculation,
} from '@lightdash/common';
import {
    columnHelper,
    TableColumn,
    TableHeader,
} from '../../components/common/Table/types';
import { getPivotedData, PivotValueMap } from '../plottedData/usePlottedData';
import { getResultColumnTotals, isSummable } from '../useColumnTotals';

const sortByRawValue = (a: any, b: any) => {
    const typeOfA = typeof a;
    const typeOfB = typeof b;
    try {
        if (typeOfA === 'string' && typeOfB === 'string') {
            return a.localeCompare(b);
        }
        return a - b;
    } catch (e) {
        return -1;
    }
};

type Args = {
    columnOrder: string[];
    itemsMap: Record<string, Field | TableCalculation>;
    resultsData: ApiQueryResults;
    pivotDimensions: string[];
    isColumnVisible: (key: string) => boolean;
    getHeader: (key: string) => string | undefined;
    getDefaultColumnLabel: (key: string) => string;
};

const getPivottedColumnCount = (pivotValuesMap: PivotValueMap) =>
    Object.values(pivotValuesMap).reduce<number>(
        (acc, values) => acc * Object.keys(values).length,
        1,
    );

const getPivotDataAndColumns = ({
    columnOrder,
    itemsMap,
    resultsData,
    pivotDimensions,
    isColumnVisible,
    getHeader,
    getDefaultColumnLabel,
}: Args): {
    rows: ResultRow[];
    columns: Array<TableHeader | TableColumn>;
    error?: string;
} => {
    const keysToPivot = [
        ...resultsData.metricQuery.metrics,
        ...resultsData.metricQuery.tableCalculations.map((tc) => tc.name),
    ].filter((itemId) => isColumnVisible(itemId));
    const keysToNotPivot = resultsData.metricQuery.dimensions.filter(
        (itemId) =>
            isColumnVisible(itemId) && !pivotDimensions.includes(itemId),
    );
    const { rows, pivotValuesMap, rowKeyMap } = getPivotedData(
        resultsData.rows,
        pivotDimensions,
        keysToPivot,
        keysToNotPivot,
    );

    console.log('count', getPivottedColumnCount(pivotValuesMap));
    if (getPivottedColumnCount(pivotValuesMap) > 60) {
        return {
            rows: [],
            columns: [],
            error: 'Exceeded max amount of 60 columns from pivot values',
        };
    }

    const totals = getResultColumnTotals(
        rows,
        Object.entries(rowKeyMap).reduce<string[]>((acc, [key, ref]) => {
            const item =
                typeof ref === 'string' ? itemsMap[ref] : itemsMap[ref.field];
            return item && isSummable(item) ? [...acc, key] : acc;
        }, []),
    );

    const dimensionHeaders = keysToNotPivot.map((itemId) => {
        const item = itemsMap[itemId];
        const column: TableColumn = columnHelper.accessor(
            (row) => row[itemId],
            {
                id: itemId,
                header: getHeader(itemId) || getDefaultColumnLabel(itemId),
                cell: (info) => info.getValue()?.value.formatted || '-',
                footer: () =>
                    totals[itemId]
                        ? formatItemValue(item, totals[itemId])
                        : null,
                meta: {
                    item,
                },
            },
        );
        return column;
    });
    const dimensionsHeaderGroup = pivotDimensions
        .reverse()
        .reduce<TableColumn | undefined>((acc, pivotKey) => {
            return columnHelper.group({
                id: `dimensions_header_group_${pivotKey}`,
                header: getHeader(pivotKey) || getDefaultColumnLabel(pivotKey),
                columns: acc ? [acc] : dimensionHeaders,
                meta: {
                    bgColor: Colors.GRAY4,
                    item: itemsMap[pivotKey],
                },
            }) as TableColumn;
        }, undefined);
    pivotDimensions.reverse();

    function getPivotHeaderGroups(
        depth: number = 0,
        parentPivotValues: PivotReference['pivotValues'] = [],
    ): TableColumn[] {
        const pivotKey = pivotDimensions[depth];
        return Object.values(pivotValuesMap[pivotKey])
            .sort((a, b) => sortByRawValue(a.raw, b.raw))
            .map(({ raw, formatted }) => {
                const currentPivotValues = [
                    ...parentPivotValues,
                    {
                        field: pivotKey,
                        value: raw,
                    },
                ];
                let innerColumns: TableColumn[];
                if (pivotDimensions[depth + 1]) {
                    innerColumns = getPivotHeaderGroups(
                        depth + 1,
                        currentPivotValues,
                    );
                } else {
                    innerColumns = keysToPivot
                        .sort((a, b) => {
                            return (
                                columnOrder.findIndex((id) => id === a) -
                                columnOrder.findIndex((id) => id === b)
                            );
                        })
                        .reduce<TableColumn[]>((acc, itemId) => {
                            const item = itemsMap[itemId];
                            const pivotReference: PivotReference = {
                                field: itemId,
                                pivotValues: currentPivotValues,
                            };
                            const key = hashFieldReference(pivotReference);
                            const column: TableColumn = columnHelper.accessor(
                                (row) => row[key],
                                {
                                    id: key,
                                    header:
                                        getHeader(itemId) ||
                                        getDefaultColumnLabel(itemId),
                                    cell: (info) =>
                                        info.getValue()?.value.formatted || '-',

                                    footer: () =>
                                        totals[key]
                                            ? formatItemValue(item, totals[key])
                                            : null,
                                    meta: {
                                        item,
                                        pivotReference,
                                    },
                                },
                            );
                            return [...acc, column];
                        }, []);
                }
                return columnHelper.group({
                    id: `pivot_header_group${currentPivotValues.map(
                        ({ field, value }) => `_${field}_${value}`,
                    )}`,
                    header: () => formatted,
                    meta: {
                        bgColor: Colors.GRAY4,
                    },
                    columns: innerColumns,
                }) as TableColumn;
            });
    }

    const pivotValueHeaderGroups = getPivotHeaderGroups();

    const columns = dimensionsHeaderGroup
        ? [dimensionsHeaderGroup, ...pivotValueHeaderGroups]
        : pivotValueHeaderGroups;
    return {
        rows,
        columns,
    };
};

export default getPivotDataAndColumns;
