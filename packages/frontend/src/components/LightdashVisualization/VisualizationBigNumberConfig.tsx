import { ChartType } from '@lightdash/common';
import { FC, useEffect } from 'react';
import useBigNumberConfig from '../../hooks/useBigNumberConfig';
import {
    VisualizationConfig,
    VisualizationConfigCommon,
} from './VisualizationProvider';

export type VisualizationConfigBigNumber = {
    chartType: ChartType.BIG_NUMBER;
    chartConfig: ReturnType<typeof useBigNumberConfig>;
};

export const isBigNumberVisualizationConfig = (
    visualizationConfig: VisualizationConfig | undefined,
): visualizationConfig is VisualizationConfigBigNumber => {
    return visualizationConfig?.chartType === ChartType.BIG_NUMBER;
};

type VisualizationBigNumberConfigProps =
    VisualizationConfigCommon<VisualizationConfigBigNumber>;

const VisualizationBigNumberConfig: FC<VisualizationBigNumberConfigProps> = ({
    explore,
    resultsData,
    initialChartConfig,
    onChartConfigChange,
    children,
}) => {
    const bigNumberConfig = useBigNumberConfig(
        initialChartConfig,
        resultsData,
        explore,
    );

    useEffect(() => {
        if (!onChartConfigChange || !bigNumberConfig.validConfig) return;
        onChartConfigChange(bigNumberConfig.validConfig);
    }, [bigNumberConfig, onChartConfigChange]);

    return children({
        visualizationConfig: {
            chartType: ChartType.BIG_NUMBER,
            chartConfig: bigNumberConfig,
        },
    });
};

export default VisualizationBigNumberConfig;
