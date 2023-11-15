import { ChartType } from '@lightdash/common';
import { FC, useEffect } from 'react';
import useBigNumberConfig from '../../hooks/useBigNumberConfig';
import { VisualizationConfigCommon } from './VisualizationProvider';

export type VisualizationConfigBigNumber = {
    chartType: ChartType.BIG_NUMBER;
    chartConfig: ReturnType<typeof useBigNumberConfig>;
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
        onChartConfigChange?.(bigNumberConfig.validConfig);
    }, [bigNumberConfig, onChartConfigChange]);

    return children({
        visualizationConfig: {
            chartType: ChartType.BIG_NUMBER,
            chartConfig: bigNumberConfig,
        },
    });
};

export default VisualizationBigNumberConfig;
