import {
    AdditionalMetric,
    ApiQueryResults,
    assertUnreachable,
    ChartConfig,
    ChartType,
    convertAdditionalMetric,
    Dimension,
    Explore,
    fieldId,
    getDimensions,
    getMetrics,
    isNumericItem,
    isTableCalculation,
    Metric,
    TableCalculation,
} from '@lightdash/common';
import EChartsReact from 'echarts-for-react';
import {
    createContext,
    FC,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import useCartesianChartConfig from '../../hooks/cartesianChartConfig/useCartesianChartConfig';
import { EChartSeries } from '../../hooks/echarts/useEcharts';
import useTableConfig from '../../hooks/tableVisualization/useTableConfig';
import useBigNumberConfig from '../../hooks/useBigNumberConfig';
import usePieChartConfig from '../../hooks/usePieChartConfig';
import usePivotDimensions from '../../hooks/usePivotDimensions';
import { EchartSeriesClickEvent } from '../SimpleChart';

type VisualizationContext = {
    minimal: boolean;
    chartRef: RefObject<EChartsReact>;
    chartType: ChartType;
    cartesianConfig: ReturnType<typeof useCartesianChartConfig>;
    bigNumberConfig: ReturnType<typeof useBigNumberConfig>;
    pieChartConfig: ReturnType<typeof usePieChartConfig>;
    tableConfig: ReturnType<typeof useTableConfig>;
    pivotDimensions: string[] | undefined;
    explore: Explore | undefined;
    originalData: ApiQueryResults['rows'];
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    columnOrder: string[];
    isSqlRunner: boolean;
    dimensions: Dimension[];
    metrics: Metric[];
    allMetrics: (Metric | AdditionalMetric | TableCalculation)[];
    allNumericMetrics: (Metric | AdditionalMetric | TableCalculation)[];
    customMetrics: AdditionalMetric[];
    tableCalculations: TableCalculation[];
    onSeriesContextMenu?: (
        e: EchartSeriesClickEvent,
        series: EChartSeries[],
    ) => void;
    setChartType: (value: ChartType) => void;
    setPivotDimensions: (value: string[] | undefined) => void;
};

const Context = createContext<VisualizationContext | undefined>(undefined);

type Props = {
    minimal?: boolean;
    chartType: ChartType;
    initialChartConfig: ChartConfig | undefined;
    initialPivotDimensions: string[] | undefined;
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    columnOrder: string[];
    onSeriesContextMenu?: (
        e: EchartSeriesClickEvent,
        series: EChartSeries[],
    ) => void;
    onChartConfigChange?: (value: ChartConfig['config']) => void;
    onChartTypeChange?: (value: ChartType) => void;
    onPivotDimensionsChange?: (value: string[] | undefined) => void;
    explore: Explore | undefined;
};

const VisualizationProvider: FC<Props> = ({
    minimal = false,
    initialChartConfig,
    chartType,
    initialPivotDimensions,
    resultsData,
    isLoading,
    columnOrder,
    onSeriesContextMenu,
    onChartConfigChange,
    onChartTypeChange,
    onPivotDimensionsChange,
    explore,
    children,
}) => {
    const chartRef = useRef<EChartsReact>(null);

    const [lastValidResultsData, setLastValidResultsData] =
        useState<ApiQueryResults>();
    useEffect(() => {
        if (!!resultsData) {
            setLastValidResultsData(resultsData);
        }
    }, [resultsData]);

    const { validPivotDimensions, setPivotDimensions } = usePivotDimensions(
        initialPivotDimensions,
        lastValidResultsData,
    );
    const setChartType = useCallback(
        (value: ChartType) => {
            onChartTypeChange?.(value);
        },
        [onChartTypeChange],
    );

    const dimensions = useMemo(() => {
        if (!explore) return [];
        return getDimensions(explore).filter((field) =>
            resultsData?.metricQuery.dimensions.includes(fieldId(field)),
        );
    }, [explore, resultsData?.metricQuery.dimensions]);

    const dimensionIds = useMemo(() => dimensions.map(fieldId), [dimensions]);

    const metrics = useMemo(() => {
        if (!explore) return [];
        return getMetrics(explore).filter((field) =>
            resultsData?.metricQuery.metrics.includes(fieldId(field)),
        );
    }, [explore, resultsData?.metricQuery.metrics]);

    const customMetrics = useMemo(() => {
        if (!explore) return [];

        return (resultsData?.metricQuery.additionalMetrics || []).reduce<
            Metric[]
        >((acc, additionalMetric) => {
            const table = explore.tables[additionalMetric.table];
            if (!table) return acc;

            const metric = convertAdditionalMetric({
                additionalMetric,
                table,
            });
            return [...acc, metric];
        }, []);
    }, [explore, resultsData?.metricQuery.additionalMetrics]);

    const tableCalculations = useMemo(() => {
        return resultsData?.metricQuery.tableCalculations ?? [];
    }, [resultsData?.metricQuery.tableCalculations]);

    const allMetrics = useMemo(
        () => [...metrics, ...customMetrics, ...tableCalculations],
        [metrics, customMetrics, tableCalculations],
    );

    const allNumericMetrics = useMemo(
        () => allMetrics.filter((m) => isNumericItem(m)),
        [allMetrics],
    );

    const allNumericMetricIds = useMemo(() => {
        return allNumericMetrics.map((m) =>
            isTableCalculation(m) ? m.name : fieldId(m),
        );
    }, [allNumericMetrics]);

    const bigNumberConfig = useBigNumberConfig(
        initialChartConfig?.type === ChartType.BIG_NUMBER
            ? initialChartConfig.config
            : undefined,
        lastValidResultsData,
        explore,
    );

    // If we don't toggle any fields, (eg: when you `explore from here`) columnOrder on tableConfig might be empty
    // so we initialize it with the fields from resultData
    const defaultColumnOrder = useMemo(() => {
        if (columnOrder.length > 0) {
            return columnOrder;
        } else {
            const metricQuery = resultsData?.metricQuery;
            const metricQueryFields =
                metricQuery !== undefined
                    ? [
                          ...metricQuery.dimensions,
                          ...metricQuery.metrics,
                          ...metricQuery.tableCalculations.map(
                              ({ name }) => name,
                          ),
                      ]
                    : [];
            return metricQueryFields;
        }
    }, [resultsData?.metricQuery, columnOrder]);

    const tableConfig = useTableConfig(
        initialChartConfig?.type === ChartType.TABLE
            ? initialChartConfig.config
            : undefined,
        lastValidResultsData,
        explore,
        (columnOrder = defaultColumnOrder),
        validPivotDimensions,
    );

    const { validBigNumberConfig } = bigNumberConfig;
    const { validTableConfig } = tableConfig;

    const isSqlRunner = useMemo(() => {
        return explore?.name === 'sql_runner';
    }, [explore?.name]);

    const cartesianConfig = useCartesianChartConfig({
        chartType,
        initialChartConfig:
            initialChartConfig?.type === ChartType.CARTESIAN
                ? initialChartConfig.config
                : undefined,
        pivotKeys: validPivotDimensions,
        resultsData: lastValidResultsData,
        setPivotDimensions,
        columnOrder: isSqlRunner ? [] : defaultColumnOrder,
        explore: isSqlRunner ? undefined : explore,
    });

    const { validCartesianConfig } = cartesianConfig;

    const pieChartConfig = usePieChartConfig(
        explore,
        resultsData,
        initialChartConfig?.type === ChartType.PIE
            ? initialChartConfig.config
            : undefined,
        dimensionIds,
        allNumericMetricIds,
    );

    const { validPieChartConfig } = pieChartConfig;

    useEffect(() => {
        let validConfig: ChartConfig['config'];
        switch (chartType) {
            case ChartType.CARTESIAN:
                validConfig = validCartesianConfig;
                break;
            case ChartType.BIG_NUMBER:
                validConfig = validBigNumberConfig;
                break;
            case ChartType.TABLE:
                validConfig = validTableConfig;
                break;
            case ChartType.PIE:
                validConfig = validPieChartConfig;
                break;
            default:
                assertUnreachable(
                    chartType,
                    `Unexpected chart type: ${chartType}`,
                );
        }
        onChartConfigChange?.(validConfig);
    }, [
        onChartConfigChange,
        chartType,
        validCartesianConfig,
        validPieChartConfig,
        validBigNumberConfig,
        validTableConfig,
    ]);

    useEffect(() => {
        onPivotDimensionsChange?.(validPivotDimensions);
    }, [validPivotDimensions, onPivotDimensionsChange]);

    const value: VisualizationContext = useMemo(
        () => ({
            minimal,
            pivotDimensions: validPivotDimensions,
            cartesianConfig,
            bigNumberConfig,
            pieChartConfig,
            tableConfig,
            chartRef,
            chartType,
            explore,
            originalData: lastValidResultsData?.rows || [],
            resultsData: lastValidResultsData,
            isLoading,
            columnOrder,
            isSqlRunner,
            dimensions,
            metrics,
            customMetrics,
            tableCalculations,
            allMetrics,
            allNumericMetrics,
            onSeriesContextMenu,
            setChartType,
            setPivotDimensions,
        }),
        [
            minimal,
            chartType,
            columnOrder,
            explore,
            isLoading,
            isSqlRunner,
            lastValidResultsData,
            tableConfig,
            bigNumberConfig,
            cartesianConfig,
            pieChartConfig,
            validPivotDimensions,
            dimensions,
            metrics,
            customMetrics,
            tableCalculations,
            allMetrics,
            allNumericMetrics,
            onSeriesContextMenu,
            setChartType,
            setPivotDimensions,
        ],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export function useVisualizationContext(): VisualizationContext {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error(
            'useVisualizationContext must be used within a VisualizationProvider',
        );
    }
    return context;
}

export default VisualizationProvider;
