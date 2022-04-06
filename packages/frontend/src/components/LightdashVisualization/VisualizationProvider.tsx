import {
    ApiQueryResults,
    BigNumber,
    CartesianChart,
    ChartType,
    Explore,
} from 'common';
import EChartsReact from 'echarts-for-react';
import React, {
    createContext,
    Dispatch,
    FC,
    RefObject,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';
import useBigNumberConfig from '../../hooks/useBigNumberConfig';
import useCartesianChartConfig from '../../hooks/useCartesianChartConfig';
import { useExplore } from '../../hooks/useExplore';
import usePivotDimensions from '../../hooks/usePivotDimensions';
import usePlottedData from '../../hooks/usePlottedData';
import { EchartSeriesClickEvent } from '../SimpleChart';

type VisualizationContext = {
    chartRef: RefObject<EChartsReact>;
    chartType: ChartType;
    cartesianConfig: ReturnType<
        typeof useCartesianChartConfig | typeof useBigNumberConfig
    >;
    pivotDimensions: string[] | undefined;
    explore: Explore | undefined;
    originalData: ApiQueryResults['rows'];
    plotData: ApiQueryResults['rows'];
    bigNumber: number | string;
    bigNumberLabel: string | undefined;
    setBigNumberLabel: Dispatch<SetStateAction<string>>;
    bigNumberConfig: BigNumber | undefined;
    setBigNumberConfig: Dispatch<SetStateAction<BigNumber | undefined>>;
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    onSeriesContextMenu?: (e: EchartSeriesClickEvent) => void;
    setChartType: (value: ChartType) => void;
    setPivotDimensions: (value: string[] | undefined) => void;
};

const Context = createContext<VisualizationContext | undefined>(undefined);

type Props = {
    chartType: ChartType;
    chartConfigs: BigNumber | CartesianChart | undefined;
    pivotDimensions: string[] | undefined;
    tableName: string | undefined;
    resultsData: ApiQueryResults | undefined;
    isLoading: boolean;
    onSeriesContextMenu?: (e: EchartSeriesClickEvent) => void;
    onChartConfigChange?: (value: CartesianChart | undefined) => void;
    onChartTypeChange?: (value: ChartType) => void;
    onPivotDimensionsChange?: (value: string[] | undefined) => void;
};

export const VisualizationProvider: FC<Props> = ({
    chartConfigs,
    chartType,
    pivotDimensions,
    tableName,
    resultsData,
    isLoading,
    onSeriesContextMenu,
    onChartConfigChange,
    onChartTypeChange,
    onPivotDimensionsChange,
    children,
}) => {
    const chartRef = useRef<EChartsReact>(null);
    const { data: explore } = useExplore(tableName);
    const { validPivotDimensions, setPivotDimensions } = usePivotDimensions(
        pivotDimensions,
        resultsData,
    );
    console.log({ chartConfigs });

    const {
        bigNumber,
        bigNumberLabel,
        setBigNumberLabel,
        bigNumberConfig,
        setBigNumberConfig,
    } = useBigNumberConfig(chartConfigs as BigNumber, resultsData, explore);

    const cartesianConfig = useCartesianChartConfig(
        chartConfigs as CartesianChart,
        validPivotDimensions?.[0],
        resultsData,
    );

    const { validCartesianConfig } = cartesianConfig;

    const plotData = usePlottedData(
        explore,
        validCartesianConfig as CartesianChart,
        resultsData,
        validPivotDimensions,
    );

    const setChartType = useCallback(
        (value: ChartType) => {
            onChartTypeChange?.(value);
        },
        [onChartTypeChange],
    );

    useEffect(() => {
        onChartConfigChange?.(validCartesianConfig);
    }, [validCartesianConfig, onChartConfigChange]);

    useEffect(() => {
        onPivotDimensionsChange?.(validPivotDimensions);
    }, [validPivotDimensions, onPivotDimensionsChange]);

    return (
        <Context.Provider
            value={{
                pivotDimensions: validPivotDimensions,
                cartesianConfig,
                chartRef,
                chartType,
                explore,
                originalData: resultsData?.rows || [],
                plotData,
                resultsData,
                bigNumber,
                bigNumberLabel,
                setBigNumberLabel,
                bigNumberConfig,
                setBigNumberConfig,
                isLoading,
                onSeriesContextMenu,
                setChartType,
                setPivotDimensions,
            }}
        >
            {children}
        </Context.Provider>
    );
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
