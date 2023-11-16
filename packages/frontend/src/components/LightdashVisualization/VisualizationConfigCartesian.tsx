import { ChartType } from '@lightdash/common';
import { FC, useEffect } from 'react';
import useCartesianChartConfig from '../../hooks/cartesianChartConfig/useCartesianChartConfig';
import {
    VisualizationConfig,
    VisualizationConfigCommon,
} from './VisualizationProvider';

export type VisualizationConfigCartesian = {
    chartType: ChartType.CARTESIAN;
    chartConfig: ReturnType<typeof useCartesianChartConfig>;
};

export const isCartesianVisualizationConfig = (
    visualizationConfig: VisualizationConfig | undefined,
): visualizationConfig is VisualizationConfigCartesian => {
    return visualizationConfig?.chartType === ChartType.CARTESIAN;
};

type VisualizationCartesianConfigProps =
    VisualizationConfigCommon<VisualizationConfigCartesian> & {
        columnOrder: string[];
        validPivotDimensions: string[] | undefined;
        setPivotDimensions: React.Dispatch<
            React.SetStateAction<string[] | undefined>
        >;
    };

const VisualizationCartesianConfig: FC<VisualizationCartesianConfigProps> = ({
    explore,
    resultsData,
    validPivotDimensions,
    columnOrder,
    setPivotDimensions,
    initialChartConfig,
    onChartConfigChange,
    children,
}) => {
    const cartesianConfig = useCartesianChartConfig({
        initialChartConfig,
        pivotKeys: validPivotDimensions,
        resultsData,
        setPivotDimensions,
        columnOrder,
        explore,
    });

    useEffect(() => {
        if (!onChartConfigChange || !cartesianConfig.validConfig) return;

        onChartConfigChange(cartesianConfig.validConfig);
    }, [cartesianConfig, onChartConfigChange]);

    return children({
        visualizationConfig: {
            chartType: ChartType.CARTESIAN,
            chartConfig: cartesianConfig,
        },
    });
};

export default VisualizationCartesianConfig;
