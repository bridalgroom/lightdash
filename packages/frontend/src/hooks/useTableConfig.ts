import {
    AdditionalMetric,
    ApiQueryResults,
    ColumnProperties,
    Explore,
    Field,
    friendlyName,
    getAdditionalMetricLabel,
    getItemLabel,
    getItemMap,
    isAdditionalMetric,
    isField,
    TableCalculation,
    TableChart,
} from '@lightdash/common';
import { useMemo, useState } from 'react';

const useTableConfig = (
    tableChartConfig: TableChart | undefined,
    resultsData: ApiQueryResults | undefined,
    explore: Explore | undefined,
    columnOrder: string[],
) => {
    const [showTableNames, setShowTableName] = useState<boolean>(
        tableChartConfig?.showTableNames === undefined
            ? true
            : tableChartConfig.showTableNames,
    );

    const [columnProperties, setColumnProperties] = useState<
        Record<string, ColumnProperties>
    >(tableChartConfig?.columns === undefined ? {} : tableChartConfig?.columns);

    const itemMap = useMemo<
        Record<string, Field | AdditionalMetric | TableCalculation>
    >(() => {
        if (explore && resultsData) {
            return getItemMap(
                explore,
                resultsData.metricQuery.additionalMetrics,
                resultsData.metricQuery.tableCalculations,
            );
        }
        return {};
    }, [explore, resultsData]);

    const getColumnHeader = (fieldId: string) => {
        const field = itemMap && itemMap[fieldId];
        if (isAdditionalMetric(field)) {
            // AdditionalMetric
            return getAdditionalMetricLabel(field);
        } else if (isField(field)) {
            // Field
            return showTableNames ? getItemLabel(field) : field.label;
        } else {
            //TableCalculation
            return friendlyName(fieldId);
        }
    };

    const isFilterVisible = (fieldId: string) =>
        columnProperties[fieldId]?.visible ?? true;

    const getHeader = (fieldId: string) => {
        const properties = columnProperties[fieldId];
        return properties?.name || getColumnHeader(fieldId);
    };

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

    const validTableConfig: TableChart = useMemo(
        () => ({
            showTableNames,
            columns: columnProperties,
        }),
        [showTableNames, columnProperties],
    );

    return {
        columnOrder,
        validTableConfig,
        showTableNames,
        setShowTableName,
        itemMap,
        columnProperties,
        setColumnProperties,
        updateColumnProperty,
        getHeader,
        isFilterVisible,
    };
};

export default useTableConfig;
