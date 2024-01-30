import { ChartType, ItemsMap } from '@lightdash/common';
import { FC, useEffect } from 'react';
import useCustomVisualizationConfig from '../../hooks/useCustomVisualizationConfig';
import {
    VisualizationConfig,
    VisualizationConfigCommon,
} from './VisualizationProvider';

export type VisualizationCustomConfigType = {
    chartType: ChartType.CUSTOM;
    chartConfig: ReturnType<typeof useCustomVisualizationConfig>;
};

export const isCustomVisualizationConfig = (
    visualizationConfig: VisualizationConfig | undefined,
): visualizationConfig is VisualizationCustomConfigType => {
    return visualizationConfig?.chartType === ChartType.CUSTOM;
};

type VisualizationCustomConfigProps =
    VisualizationConfigCommon<VisualizationCustomConfigType> & {
        // TODO: shared prop once all visualizations are converted
        itemsMap: ItemsMap | undefined;
    };

const VisualizationCustomConfig: FC<VisualizationCustomConfigProps> = ({
    initialChartConfig,
    resultsData,
    itemsMap,
    onChartConfigChange,
    children,
}) => {
    const customVisConfig = useCustomVisualizationConfig(
        initialChartConfig,
        resultsData,
        itemsMap,
    );

    useEffect(() => {
        if (!onChartConfigChange || !customVisConfig) return;

        onChartConfigChange({
            type: ChartType.CUSTOM,
            config: customVisConfig.validConfig,
        });
    }, [customVisConfig, onChartConfigChange]);

    return children({
        visualizationConfig: {
            chartType: ChartType.CUSTOM,
            chartConfig: customVisConfig,
        },
    });
};

export default VisualizationCustomConfig;
