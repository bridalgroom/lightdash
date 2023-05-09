import {
    DashboardFilters,
    Explore,
    Field,
    getItemId,
    hashFieldReference,
    isDimension,
    MetricQuery,
    PivotReference,
    ResultValue,
    TableCalculation,
} from '@lightdash/common';
import { createContext, FC, useCallback, useContext, useState } from 'react';
import { EChartSeries } from '../../hooks/echarts/useEcharts';
import { useExplore } from '../../hooks/useExplore';
import { EchartSeriesClickEvent } from '../SimpleChart';

export type UnderlyingDataConfig = {
    item: Field | TableCalculation | undefined;
    value: ResultValue;
    fieldValues: Record<string, ResultValue>;
    dimensions?: string[];
    pivotReference?: PivotReference;
    dashboardFilters?: DashboardFilters;
};

export type DrillDownConfig = {
    item: Field | TableCalculation;
    fieldValues: Record<string, ResultValue>;
    pivotReference?: PivotReference;
    dashboardFilters?: DashboardFilters;
};

type MetricQueryDataContext = {
    tableName: string;
    explore: Explore | undefined;
    metricQuery?: MetricQuery;

    underlyingDataConfig: UnderlyingDataConfig | undefined;
    isUnderlyingDataModalOpen: boolean;
    openUnderlyingDataModal: (config: UnderlyingDataConfig) => void;
    closeUnderlyingDataModal: () => void;

    drillDownConfig: DrillDownConfig | undefined;
    isDrillDownModalOpen: boolean;
    openDrillDownModel: (config: DrillDownConfig) => void;
    closeDrillDownModal: () => void;
};

export const getDataFromChartClick = (
    e: EchartSeriesClickEvent,
    itemsMap: Record<string, Field | TableCalculation>,
    series: EChartSeries[],
): UnderlyingDataConfig => {
    const pivotReference = series[e.seriesIndex]?.pivotReference;
    const selectedFields = Object.values(itemsMap).filter((item) => {
        if (
            !isDimension(item) &&
            pivotReference &&
            pivotReference.field === getItemId(item)
        ) {
            return e.dimensionNames.includes(
                hashFieldReference(pivotReference),
            );
        }
        return e.dimensionNames.includes(getItemId(item));
    });
    const selectedMetricsAndTableCalculations = selectedFields.filter(
        (item) => !isDimension(item),
    );

    let selectedField: Field | TableCalculation | undefined = undefined;
    if (selectedMetricsAndTableCalculations.length > 0) {
        selectedField = selectedMetricsAndTableCalculations[0];
    } else if (selectedFields.length > 0) {
        selectedField = selectedFields[0];
    }
    const selectedValue = selectedField
        ? e.data[getItemId(selectedField)]
        : undefined;
    const fieldValues: Record<string, ResultValue> = Object.entries(
        e.data as Record<string, any>,
    ).reduce((acc, entry) => {
        const [key, val] = entry;
        return { ...acc, [key]: { raw: val, formatted: val } };
    }, {});

    return {
        item: selectedField,
        value: { raw: selectedValue, formatted: selectedValue },
        fieldValues,
        pivotReference,
    };
};
const Context = createContext<MetricQueryDataContext | undefined>(undefined);

type Props = {
    tableName: string;
    metricQuery: MetricQuery | undefined;
};

const MetricQueryDataProvider: FC<Props> = ({
    tableName,
    metricQuery,
    children,
}) => {
    const [underlyingDataConfig, setUnderlyingDataConfig] =
        useState<UnderlyingDataConfig>();
    const [drillDownConfig, setDrillDownConfig] = useState<DrillDownConfig>();
    const [isUnderlyingDataModalOpen, setIsUnderlyingDataModalOpen] =
        useState<boolean>(false);
    const [isDrillDownModalOpen, setIsDrillDownModalOpen] =
        useState<boolean>(false);
    const { data: explore } = useExplore(tableName);

    const openDrillDownModel = useCallback(
        (config: DrillDownConfig) => {
            setDrillDownConfig(config);
            setIsDrillDownModalOpen(true);
        },
        [setDrillDownConfig],
    );
    const closeDrillDownModal = useCallback(() => {
        setIsDrillDownModalOpen(false);
    }, []);

    const openUnderlyingDataModal = useCallback(
        (config: UnderlyingDataConfig) => {
            setUnderlyingDataConfig(config);
            setIsUnderlyingDataModalOpen(true);
        },
        [setUnderlyingDataConfig],
    );
    const closeUnderlyingDataModal = useCallback(() => {
        setIsUnderlyingDataModalOpen(false);
    }, []);

    return (
        <Context.Provider
            value={{
                tableName,
                metricQuery,
                underlyingDataConfig,
                openUnderlyingDataModal,
                isUnderlyingDataModalOpen,
                closeUnderlyingDataModal,
                isDrillDownModalOpen,
                drillDownConfig,
                openDrillDownModel,
                closeDrillDownModal,
                explore,
            }}
        >
            {children}
        </Context.Provider>
    );
};

export function useMetricQueryDataContext(): MetricQueryDataContext {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error(
            'useMetricQueryDataContext must be used within a UnderlyingDataProvider',
        );
    }
    return context;
}

export default MetricQueryDataProvider;
