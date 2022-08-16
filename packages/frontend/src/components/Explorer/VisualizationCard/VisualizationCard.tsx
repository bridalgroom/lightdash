import { Button, Collapse, H5 } from '@blueprintjs/core';
import { ChartType } from '@lightdash/common';
import { FC, useCallback, useState } from 'react';
import { EChartSeries } from '../../../hooks/echarts/useEcharts';
import { useExplore } from '../../../hooks/useExplore';
import {
    ExplorerSection,
    useExplorer,
} from '../../../providers/ExplorerProvider';
import BigNumberConfigPanel from '../../BigNumberConfig';
import ChartConfigPanel from '../../ChartConfigPanel';
import { ChartDownloadMenu } from '../../ChartDownload';
import LightdashVisualization from '../../LightdashVisualization';
import VisualizationProvider from '../../LightdashVisualization/VisualizationProvider';
import { EchartSeriesClickEvent } from '../../SimpleChart';
import TableConfigPanel from '../../TableConfigPanel';
import VisualizationCardOptions from '../VisualizationCardOptions';
import { SeriesContextMenu } from './SeriesContextMenu';
import {
    CardHeader,
    CardHeaderButtons,
    CardHeaderTitle,
    MainCard,
    VisualizationCardContentWrapper,
} from './VisualizationCard.styles';

const ConfigPanel: FC<{ chartType: ChartType }> = ({ chartType }) => {
    switch (chartType) {
        case ChartType.BIG_NUMBER:
            return <BigNumberConfigPanel />;
        case ChartType.TABLE:
            return <TableConfigPanel />;
        default:
            return <ChartConfigPanel />;
    }
};
const VisualizationCard: FC = () => {
    const {
        state: { isEditMode, unsavedChartVersion, expandedSections },
        queryResults,
        actions: {
            setPivotFields,
            setChartType,
            setChartConfig,
            toggleExpandedSection,
        },
    } = useExplorer();
    const { data: explore } = useExplore(unsavedChartVersion.tableName);
    const vizIsOpen = expandedSections.includes(ExplorerSection.VISUALIZATION);

    const [echartSeriesClickEvent, setEchartSeriesClickEvent] =
        useState<EchartSeriesClickEvent>();

    const onSeriesContextMenu = useCallback(
        (e: EchartSeriesClickEvent, series: EChartSeries[]) => {
            setEchartSeriesClickEvent(e);

            /* if (explore) {
                const dimensions = getDimensions(explore).filter((dimension) =>
                    e.dimensionNames.includes(fieldId(dimension)),
                );
                const selectedDimension = dimensions[0];
                const selectedValue = e.data[fieldId(selectedDimension)];

                setViewUnderlyingDataOptions({
                    meta: { item: selectedDimension },
                    value: { raw: selectedValue, formatted: selectedValue },
                    row: e.data as ResultRow,
                });
                setContextMenuIsOpen(true);
                setContextMenuTargetOffset({
                    left: e.event.event.pageX,
                    top: e.event.event.pageY,
                });
            }*/
        },
        [],
    );

    if (!unsavedChartVersion.tableName) {
        return (
            <MainCard elevation={1}>
                <CardHeader>
                    <CardHeaderTitle>
                        <Button icon={'chevron-right'} minimal disabled />
                        <H5>Charts</H5>
                    </CardHeaderTitle>
                </CardHeader>
            </MainCard>
        );
    }

    return (
        <MainCard elevation={1}>
            <VisualizationProvider
                initialChartConfig={unsavedChartVersion.chartConfig}
                chartType={unsavedChartVersion.chartConfig.type}
                initialPivotDimensions={
                    unsavedChartVersion.pivotConfig?.columns
                }
                explore={explore}
                resultsData={queryResults.data}
                isLoading={queryResults.isLoading}
                onChartConfigChange={setChartConfig}
                onChartTypeChange={setChartType}
                onPivotDimensionsChange={setPivotFields}
                columnOrder={unsavedChartVersion.tableConfig.columnOrder}
                onSeriesContextMenu={onSeriesContextMenu}
            >
                <CardHeader>
                    <CardHeaderTitle>
                        <Button
                            icon={vizIsOpen ? 'chevron-down' : 'chevron-right'}
                            minimal
                            onClick={() =>
                                toggleExpandedSection(
                                    ExplorerSection.VISUALIZATION,
                                )
                            }
                        />
                        <H5>Charts</H5>
                    </CardHeaderTitle>
                    {vizIsOpen && (
                        <CardHeaderButtons>
                            {isEditMode && (
                                <>
                                    <VisualizationCardOptions />
                                    <ConfigPanel
                                        chartType={
                                            unsavedChartVersion.chartConfig.type
                                        }
                                    />
                                </>
                            )}
                            <ChartDownloadMenu />
                        </CardHeaderButtons>
                    )}
                </CardHeader>
                <Collapse className="explorer-chart" isOpen={vizIsOpen}>
                    <VisualizationCardContentWrapper className="cohere-block">
                        <LightdashVisualization />

                        <SeriesContextMenu
                            echartSeriesClickEvent={echartSeriesClickEvent}
                        />
                    </VisualizationCardContentWrapper>
                </Collapse>
            </VisualizationProvider>
        </MainCard>
    );
};

export default VisualizationCard;
