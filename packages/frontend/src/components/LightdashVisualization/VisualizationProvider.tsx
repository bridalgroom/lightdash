import {
    AdditionalMetric,
    ApiQueryResults,
    assertUnreachable,
    ChartConfig,
    ChartType,
    convertAdditionalMetric,
    CustomDimension,
    Dimension,
    Explore,
    fieldId,
    getCustomDimensionId,
    getDimensions,
    getMetrics,
    isNumericItem,
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
import { EChartSeries } from '../../hooks/echarts/useEchartsCartesianConfig';
import usePivotDimensions from '../../hooks/usePivotDimensions';
import { EchartSeriesClickEvent } from '../SimpleChart';
import VisualizationBigNumberConfig, {
    VisualizationConfigBigNumber,
} from './VisualizationBigNumberConfig';
import VisualizationCartesianConfig, {
    VisualizationConfigCartesian,
} from './VisualizationConfigCartesian';
import VisualizationPieConfig, {
    VisualizationConfigPie,
} from './VisualizationConfigPie';
import VisualizationTableConfig, {
    VisualizationConfigTable,
} from './VisualizationConfigTable';
import VisualizationCustomConfig, {
    VisualizationConfigCustom,
} from './VisualizationCustomConfigProps';

export type VisualizationConfig =
    | VisualizationConfigBigNumber
    | VisualizationConfigCartesian
    | VisualizationConfigCustom
    | VisualizationConfigPie
    | VisualizationConfigTable;

type VisualizationContext = {
    minimal: boolean;
    chartRef: RefObject<EChartsReact>;
    pivotDimensions: string[] | undefined;
    explore: Explore | undefined;
    originalData: ApiQueryResults['rows'];
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    columnOrder: string[];
    isSqlRunner: boolean;
    dimensions: Dimension[];
    customDimensions: CustomDimension[];
    metrics: Metric[];
    allMetrics: (Metric | TableCalculation)[];
    allNumericMetrics: (Metric | TableCalculation)[];
    customMetrics: AdditionalMetric[];
    tableCalculations: TableCalculation[];
    visualizationConfig: VisualizationConfig | undefined;
    onSeriesContextMenu?: (
        e: EchartSeriesClickEvent,
        series: EChartSeries[],
    ) => void;
    setChartType: (value: ChartType) => void;
    setPivotDimensions: (value: string[] | undefined) => void;
};

const Context = createContext<VisualizationContext | undefined>(undefined);

export function useVisualizationContext(): VisualizationContext {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error(
            'useVisualizationContext must be used within a VisualizationProvider',
        );
    }
    return context;
}

export type VisualizationConfigCommon<T extends VisualizationConfig> = {
    explore?: Explore;
    resultsData: ApiQueryResults | undefined;
    initialChartConfig: T['chartConfig']['validConfig'] | undefined;
    onChartConfigChange?: (value: T['chartConfig']['validConfig']) => void;
    children: (props: { visualizationConfig: T }) => JSX.Element;
};

type Props = {
    minimal?: boolean;
    chartConfig: ChartConfig | undefined;
    initialPivotDimensions: string[] | undefined;
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    columnOrder: string[];
    onSeriesContextMenu?: (
        e: EchartSeriesClickEvent,
        series: EChartSeries[],
    ) => void;
    onChartTypeChange?: (value: ChartType) => void;
    onChartConfigChange?: (value: ChartConfig['config']) => void;
    onPivotDimensionsChange?: (value: string[] | undefined) => void;
    explore: Explore | undefined;
    isSqlRunner?: boolean;
    pivotTableMaxColumnLimit: number;
};

const VisualizationProvider: FC<Props> = ({
    minimal = false,
    chartConfig,
    initialPivotDimensions,
    resultsData,
    isLoading,
    columnOrder,
    onSeriesContextMenu,
    onChartTypeChange,
    // onChartConfigChange,
    onPivotDimensionsChange,
    explore,
    isSqlRunner,
    pivotTableMaxColumnLimit,
    children,
}) => {
    const chartRef = useRef<EChartsReact>(null);

    const setChartType = useCallback(
        (value: ChartType) => onChartTypeChange?.(value),
        [onChartTypeChange],
    );

    const [lastValidResultsData, setLastValidResultsData] =
        useState<ApiQueryResults>();

    const { validPivotDimensions, setPivotDimensions } = usePivotDimensions(
        initialPivotDimensions,
        lastValidResultsData,
    );

    const dimensions = useMemo(() => {
        if (!explore) return [];
        return getDimensions(explore).filter((field) =>
            resultsData?.metricQuery.dimensions.includes(fieldId(field)),
        );
    }, [explore, resultsData?.metricQuery.dimensions]);

    const metrics = useMemo(() => {
        if (!explore) return [];
        return getMetrics(explore).filter((field) =>
            resultsData?.metricQuery.metrics.includes(fieldId(field)),
        );
    }, [explore, resultsData?.metricQuery.metrics]);

    const customDimensions = useMemo(() => {
        return resultsData?.metricQuery.customDimensions || [];
    }, [resultsData?.metricQuery.customDimensions]);

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

            if (!resultsData?.metricQuery.metrics.includes(fieldId(metric))) {
                return acc;
            }

            return [...acc, metric];
        }, []);
    }, [
        explore,
        resultsData?.metricQuery.additionalMetrics,
        resultsData?.metricQuery.metrics,
    ]);

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
                          ...(metricQuery.customDimensions?.map(
                              getCustomDimensionId,
                          ) || []),
                      ]
                    : [];
            return metricQueryFields;
        }
    }, [resultsData?.metricQuery, columnOrder]);

    useEffect(() => {
        if (!resultsData) return;
        setLastValidResultsData(resultsData);
    }, [resultsData]);

    useEffect(() => {
        onPivotDimensionsChange?.(validPivotDimensions);
    }, [validPivotDimensions, onPivotDimensionsChange]);

    const value: Omit<VisualizationContext, 'visualizationConfig'> = {
        minimal,
        pivotDimensions: validPivotDimensions,
        chartRef,
        originalData: lastValidResultsData?.rows || [],
        resultsData: lastValidResultsData,
        isLoading,
        explore,
        columnOrder,
        isSqlRunner: isSqlRunner || false,
        dimensions,
        metrics,
        customMetrics,
        customDimensions,
        tableCalculations,
        allMetrics,
        allNumericMetrics,
        onSeriesContextMenu,
        setChartType,
        setPivotDimensions,
    };

    switch (chartConfig?.type) {
        case undefined:
            return (
                <Context.Provider
                    value={{ ...value, visualizationConfig: undefined }}
                >
                    {children}
                </Context.Provider>
            );
        case ChartType.CARTESIAN:
            return (
                <VisualizationCartesianConfig
                    explore={isSqlRunner ? undefined : explore}
                    resultsData={lastValidResultsData}
                    validPivotDimensions={validPivotDimensions}
                    columnOrder={isSqlRunner ? [] : defaultColumnOrder}
                    setPivotDimensions={setPivotDimensions}
                    initialChartConfig={chartConfig.config}
                    //onChartConfigChange={onChartConfigChange}
                >
                    {({ visualizationConfig }) => (
                        <Context.Provider
                            value={{ ...value, visualizationConfig }}
                        >
                            {children}
                        </Context.Provider>
                    )}
                </VisualizationCartesianConfig>
            );
        case ChartType.PIE:
            return (
                <VisualizationPieConfig
                    explore={explore}
                    resultsData={lastValidResultsData}
                    dimensions={dimensions}
                    allNumericMetrics={allNumericMetrics}
                    customDimensions={customDimensions}
                    initialChartConfig={chartConfig.config}
                    //onChartConfigChange={onChartConfigChange}
                >
                    {({ visualizationConfig }) => (
                        <Context.Provider
                            value={{ ...value, visualizationConfig }}
                        >
                            {children}
                        </Context.Provider>
                    )}
                </VisualizationPieConfig>
            );
        case ChartType.BIG_NUMBER:
            return (
                <VisualizationBigNumberConfig
                    explore={explore}
                    resultsData={lastValidResultsData}
                    initialChartConfig={chartConfig.config}
                    //onChartConfigChange={onChartConfigChange}
                >
                    {({ visualizationConfig }) => (
                        <Context.Provider
                            value={{ ...value, visualizationConfig }}
                        >
                            {children}
                        </Context.Provider>
                    )}
                </VisualizationBigNumberConfig>
            );
        case ChartType.TABLE:
            return (
                <VisualizationTableConfig
                    explore={explore}
                    resultsData={lastValidResultsData}
                    columnOrder={defaultColumnOrder}
                    validPivotDimensions={validPivotDimensions}
                    pivotTableMaxColumnLimit={pivotTableMaxColumnLimit}
                    initialChartConfig={chartConfig.config}
                    //onChartConfigChange={onChartConfigChange}
                >
                    {({ visualizationConfig }) => (
                        <Context.Provider
                            value={{ ...value, visualizationConfig }}
                        >
                            {children}
                        </Context.Provider>
                    )}
                </VisualizationTableConfig>
            );
        case ChartType.CUSTOM:
            return (
                <VisualizationCustomConfig
                    explore={explore}
                    resultsData={lastValidResultsData}
                    initialChartConfig={chartConfig.config}
                    //onChartConfigChange={onChartConfigChange}
                >
                    {({ visualizationConfig }) => (
                        <Context.Provider
                            value={{ ...value, visualizationConfig }}
                        >
                            {children}
                        </Context.Provider>
                    )}
                </VisualizationCustomConfig>
            );
        default:
            return assertUnreachable(chartConfig, 'Unknown chart type');
    }
};

export default VisualizationProvider;
