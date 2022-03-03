import {
    ApiQueryResults,
    CartesianChart,
    CartesianSeriesType,
    DimensionType,
    Explore,
    findFieldByIdInExplore,
    friendlyName,
    getFieldLabel,
    MetricType,
    TableCalculation,
} from 'common';
import { useMemo } from 'react';
import { useVisualizationContext } from '../components/LightdashVisualization/VisualizationProvider';
import { getPivotedDimension } from './useFormattedAndPlottedData';

const getLabelFromField = (
    explore: Explore,
    tableCalculations: TableCalculation[],
    key: string,
) => {
    const field = findFieldByIdInExplore(explore, key);
    const tableCalculation = tableCalculations.find(({ name }) => name === key);
    if (field) {
        return getFieldLabel(field);
    } else if (tableCalculation) {
        return tableCalculation.displayName;
    } else {
        return friendlyName(key);
    }
};

const getAxisTypeFromField = (explore: Explore, key: string): string => {
    const field = findFieldByIdInExplore(explore, key);
    if (field) {
        switch (field.type) {
            case DimensionType.NUMBER:
            case MetricType.NUMBER:
            case MetricType.AVERAGE:
            case MetricType.COUNT:
            case MetricType.COUNT_DISTINCT:
            case MetricType.SUM:
            case MetricType.MIN:
            case MetricType.MAX:
                return 'value';
            case DimensionType.TIMESTAMP:
            case DimensionType.DATE:
            case MetricType.DATE:
                return 'time';
            default: {
                return 'category';
            }
        }
    } else {
        return 'category';
    }
};

const getEchartsTooltipConfig = (type: CartesianChart['series'][0]['type']) =>
    type === CartesianSeriesType.BAR
        ? {
              show: true,
              confine: true,
              trigger: 'axis',
              axisPointer: {
                  type: 'shadow',
                  label: { show: true },
              },
          }
        : {
              show: true,
              confine: true,
              trigger: 'item',
          };

export type EChartSeries = {
    type: CartesianChart['series'][0]['type'];
    connectNulls: boolean;
    encode: {
        x: string;
        y: string;
        tooltip: string[];
        seriesName: string;
    };
    dimensions: Array<{ name: string; displayName: string }>;
};

export const getEchartsSeries = (
    explore: Explore,
    tableCalculations: TableCalculation[],
    formattedData: ApiQueryResults['rows'],
    chartConfig: CartesianChart,
    pivotKey: string | undefined,
): EChartSeries[] => {
    if (pivotKey) {
        const uniquePivotValues = Array.from(
            new Set(formattedData.map((row) => row[pivotKey])),
        );
        return chartConfig.series.reduce<EChartSeries[]>(
            (sum, { yField, xField, type, flipAxes }) => {
                const xAxisDimension = {
                    name: xField,
                    displayName: getLabelFromField(
                        explore,
                        tableCalculations,
                        xField,
                    ),
                };
                const groupSeries = uniquePivotValues.map((value) => {
                    const pivotedDimension = getPivotedDimension(value, yField);
                    return {
                        type: type,
                        connectNulls: true,
                        encode: {
                            x: flipAxes ? pivotedDimension : xField,
                            y: flipAxes ? xField : pivotedDimension,
                            tooltip:
                                type === CartesianSeriesType.BAR
                                    ? [pivotedDimension]
                                    : [xField, pivotedDimension],
                            seriesName: pivotedDimension,
                        },
                        dimensions: [
                            xAxisDimension,
                            {
                                name: pivotedDimension,
                                displayName:
                                    chartConfig.series.length > 1
                                        ? `[${value}] ${getLabelFromField(
                                              explore,
                                              tableCalculations,
                                              yField,
                                          )}`
                                        : value,
                            },
                        ],
                    };
                });

                return [...sum, ...groupSeries];
            },
            [],
        );
    } else {
        return chartConfig.series.reduce<EChartSeries[]>(
            (sum, { yField, xField, type, flipAxes }) => {
                return [
                    ...sum,
                    {
                        type: type,
                        connectNulls: true,
                        encode: {
                            x: flipAxes ? yField : xField,
                            y: flipAxes ? xField : yField,
                            tooltip:
                                type === CartesianSeriesType.BAR
                                    ? [yField]
                                    : [xField, yField],
                            seriesName: yField,
                        },
                        dimensions: [
                            {
                                name: xField,
                                displayName: getLabelFromField(
                                    explore,
                                    tableCalculations,
                                    xField,
                                ),
                            },
                            {
                                name: yField,
                                displayName: getLabelFromField(
                                    explore,
                                    tableCalculations,
                                    yField,
                                ),
                            },
                        ],
                    },
                ];
            },
            [],
        );
    }
};

const useEcharts = () => {
    const {
        cartesianConfig: { validConfig },
        explore,
        plotData,
        formattedData,
        pivotDimensions,
        resultsData,
    } = useVisualizationContext();

    const series = useMemo(() => {
        if (!explore || !validConfig || !resultsData) {
            return [];
        }

        return getEchartsSeries(
            explore,
            resultsData.metricQuery.tableCalculations,
            formattedData,
            validConfig,
            pivotDimensions?.[0],
        );
    }, [explore, validConfig, resultsData, pivotDimensions, formattedData]);

    if (!explore || series.length <= 0 || plotData.length <= 0) {
        return undefined;
    }

    const [xAxis] = validConfig?.xAxes || [];
    const [yAxis] = validConfig?.yAxes || [];

    const defaultXAxisType = getAxisTypeFromField(explore, series[0].encode.x);
    const defaultYAxisType = getAxisTypeFromField(explore, series[0].encode.y);
    let xAxisType: string;
    let yAxisType: string;
    if (validConfig?.series[0].flipAxes) {
        xAxisType = 'value';
        yAxisType =
            defaultYAxisType === 'value' ? 'category' : defaultYAxisType;
    } else {
        xAxisType =
            defaultXAxisType === 'value' ? 'category' : defaultXAxisType;
        yAxisType = 'value';
    }

    return {
        xAxis: {
            type: xAxisType,
            name:
                xAxis?.name ||
                getLabelFromField(
                    explore,
                    resultsData?.metricQuery.tableCalculations || [],
                    series[0].encode.x,
                ),
            nameLocation: 'center',
            nameGap: 30,
            nameTextStyle: { fontWeight: 'bold' },
        },
        yAxis: {
            type: yAxisType,
            name:
                yAxis?.name ||
                (series.length === 1
                    ? getLabelFromField(
                          explore,
                          resultsData?.metricQuery.tableCalculations || [],
                          series[0].encode.y,
                      )
                    : undefined),
            nameTextStyle: { fontWeight: 'bold', align: 'left' },
            nameLocation: 'end',
        },
        series,
        legend: {
            show: series.length > 1,
        },
        dataset: {
            id: 'lightdashResults',
            source: plotData,
        },
        tooltip: getEchartsTooltipConfig(series[0].type),
    };
};

export default useEcharts;
