import { MenuItem2 } from '@blueprintjs/popover2';
import {
    DashboardFilters,
    Field,
    fieldId as getFieldId,
    isField,
    isMetric,
    PivotReference,
    ResultRow,
    TableCalculation,
} from '@lightdash/common';
import { FC } from 'react';
import { useMetricQueryDataContext } from './MetricQueryDataProvider';

export const DrillDownMenuItem: FC<{
    row: ResultRow | undefined;
    selectedItem: Field | TableCalculation | undefined;
    dashboardFilters?: DashboardFilters;
    pivotReference?: PivotReference;
}> = ({ row, selectedItem, dashboardFilters, pivotReference }) => {
    const { explore, metricQuery, openDrillDownModel } =
        useMetricQueryDataContext();

    if (
        selectedItem &&
        isField(selectedItem) &&
        isMetric(selectedItem) &&
        explore &&
        row &&
        metricQuery
    ) {
        const value = row[getFieldId(selectedItem)]?.value.formatted;

        return (
            <MenuItem2
                text={`Drill into "${value}"`}
                icon="path"
                onClick={() =>
                    openDrillDownModel({
                        row,
                        selectedItem,
                        dashboardFilters,
                        pivotReference,
                    })
                }
            />
        );
    }
    return null;
};

export default DrillDownMenuItem;
