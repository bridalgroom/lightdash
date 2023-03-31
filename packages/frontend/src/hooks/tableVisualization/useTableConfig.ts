import {
    ApiQueryResults,
    ColumnProperties,
    ConditionalFormattingConfig,
    Explore,
    getItemLabel,
    getItemMap,
    isField,
    itemsInMetricQuery,
    PivotData,
    ResultRow,
    TableChart,
} from '@lightdash/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableColumn, TableHeader } from '../../components/common/Table/types';
import { pivotQueryResults } from '../pivotTable/pivotQueryResults';
import getDataAndColumns from './getDataAndColumns';
import getPivotDataAndColumns from './getPivotDataAndColumns';

const useTableConfig = (
    tableChartConfig: TableChart | undefined,
    resultsData: ApiQueryResults | undefined,
    explore: Explore | undefined,
    columnOrder: string[],
    pivotDimensions: string[] | undefined,
) => {
    const [showColumnCalculation, setShowColumnCalculation] = useState<boolean>(
        !!tableChartConfig?.showColumnCalculation,
    );

    const [conditionalFormattings, setConditionalFormattings] = useState<
        ConditionalFormattingConfig[]
    >(tableChartConfig?.conditionalFormattings ?? []);

    const [showTableNames, setShowTableName] = useState<boolean>(
        tableChartConfig?.showTableNames === undefined
            ? true
            : tableChartConfig.showTableNames,
    );

    const [hideRowNumbers, setHideRowNumbers] = useState<boolean>(
        tableChartConfig?.hideRowNumbers === undefined
            ? false
            : tableChartConfig.hideRowNumbers,
    );

    const [metricsAsRows, setMetricsAsRows] = useState<boolean>(false);

    useEffect(() => {
        if (
            tableChartConfig?.showTableNames === undefined &&
            explore !== undefined
        ) {
            setShowTableName(explore.joinedTables.length > 0);
        }
    }, [explore, tableChartConfig?.showTableNames]);

    const [columnProperties, setColumnProperties] = useState<
        Record<string, ColumnProperties>
    >(tableChartConfig?.columns === undefined ? {} : tableChartConfig?.columns);

    const selectedItemIds = useMemo(
        () =>
            resultsData
                ? itemsInMetricQuery(resultsData.metricQuery)
                : undefined,
        [resultsData],
    );
    const itemsMap = useMemo(() => {
        if (explore) {
            return getItemMap(
                explore,
                resultsData?.metricQuery.additionalMetrics,
                resultsData?.metricQuery.tableCalculations,
            );
        }
        return {};
    }, [explore, resultsData]);

    const getDefaultColumnLabel = useCallback(
        (fieldId: string | null | undefined) => {
            if (fieldId === null || fieldId === undefined) {
                return '';
            }
            const item = itemsMap[fieldId] as
                | typeof itemsMap[number]
                | undefined;
            if (item === undefined) {
                return '';
            }
            if (isField(item) && !showTableNames) {
                return item.label;
            } else {
                return getItemLabel(item);
            }
        },
        [itemsMap, showTableNames],
    );

    // This is controlled by the state in this component.
    // User configures the names and visibilty of these in the config panel
    const isColumnVisible = useCallback(
        (fieldId: string) => columnProperties[fieldId]?.visible ?? true,
        [columnProperties],
    );
    const isColumnFrozen = useCallback(
        (fieldId: string) => columnProperties[fieldId]?.frozen === true,
        [columnProperties],
    );
    const getHeader = useCallback(
        (fieldId: string) => {
            return columnProperties[fieldId]?.name;
        },
        [columnProperties],
    );

    const pivotTableData = useMemo<PivotData | undefined>(() => {
        if (
            resultsData?.metricQuery &&
            resultsData.metricQuery.metrics.length &&
            resultsData.rows.length &&
            pivotDimensions?.length
        ) {
            // Pivot V2. This will always trigger when the above conditions are met.
            // The old pivot below will always trigger. So currently we pivot twice when the above conditions are met.
            return pivotQueryResults({
                pivotConfig: {
                    pivotDimensions,
                    metricsAsRows,
                },
                metricQuery: resultsData.metricQuery,
                rows: resultsData.rows,
            });
        }
    }, [resultsData, pivotDimensions, metricsAsRows]);

    const { rows, columns, error } = useMemo<{
        rows: ResultRow[];
        columns: Array<TableColumn | TableHeader>;
        error?: string;
    }>(() => {
        if (!resultsData || !selectedItemIds) {
            return {
                rows: [],
                columns: [],
            };
        }
        if (pivotDimensions && pivotDimensions.length > 0) {
            return getPivotDataAndColumns({
                columnOrder,
                itemsMap,
                resultsData,
                pivotDimensions,
                isColumnVisible,
                getHeader,
                getDefaultColumnLabel,
            });
        } else {
            return getDataAndColumns({
                itemsMap,
                selectedItemIds,
                resultsData,
                isColumnVisible,
                showTableNames,
                getHeader,
                isColumnFrozen,
            });
        }
    }, [
        selectedItemIds,
        columnOrder,
        itemsMap,
        resultsData,
        pivotDimensions,
        isColumnVisible,
        getHeader,
        getDefaultColumnLabel,
        showTableNames,
        isColumnFrozen,
    ]);

    // Remove columProperties from map if the column has been removed from results
    useEffect(() => {
        if (Object.keys(columnProperties).length > 0 && selectedItemIds) {
            const columnsRemoved = Object.keys(columnProperties).filter(
                (field) => !selectedItemIds.includes(field),
            );
            columnsRemoved.forEach((field) => delete columnProperties[field]);

            setColumnProperties(columnProperties);
        }
    }, [selectedItemIds, columnProperties]);

    const updateColumnProperty = (
        field: string,
        properties: Partial<ColumnProperties>,
    ) => {
        const newProperties =
            field in columnProperties
                ? { ...columnProperties[field], ...properties }
                : {
                      ...properties,
                  };
        setColumnProperties({
            ...columnProperties,
            [field]: newProperties,
        });
    };

    const handleSetConditionalFormattings = useCallback(
        (configs: ConditionalFormattingConfig[]) => {
            setConditionalFormattings(configs);
        },
        [],
    );

    // We don't track metricsAsRows yet in the tableConfig (this is what is saved to the backend + DB)
    const validTableConfig: TableChart = useMemo(
        () => ({
            showColumnCalculation,
            showTableNames,
            columns: columnProperties,
            hideRowNumbers,
            conditionalFormattings,
        }),
        [
            showColumnCalculation,
            hideRowNumbers,
            showTableNames,
            columnProperties,
            conditionalFormattings,
        ],
    );

    return {
        selectedItemIds,
        columnOrder,
        validTableConfig,
        showColumnCalculation,
        setShowColumnCalculation,
        showTableNames,
        setShowTableName,
        hideRowNumbers,
        setHideRowNumbers,
        metricsAsRows,
        setMetricsAsRows,
        rows,
        error,
        columns,
        columnProperties,
        setColumnProperties,
        updateColumnProperty,
        getHeader,
        getDefaultColumnLabel,
        isColumnVisible,
        isColumnFrozen,
        conditionalFormattings,
        onSetConditionalFormattings: handleSetConditionalFormattings,
        pivotTableData,
    };
};

export default useTableConfig;
