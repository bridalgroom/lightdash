import { MenuItem, NonIdealState } from '@blueprintjs/core';
import {
    DashboardChartTile as IDashboardChartTile,
    DBChartTypes,
    FilterGroup,
    SavedQuery,
} from 'common';
import EChartsReact from 'echarts-for-react';
import React, { FC, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChartConfig } from '../../hooks/useChartConfig';
import { useExplore } from '../../hooks/useExplore';
import { useSavedChartResults } from '../../hooks/useQueryResults';
import { useSavedQuery } from '../../hooks/useSavedQuery';
import { useDashboardContext } from '../../providers/DashboardProvider';
import LightdashVisualization from '../LightdashVisualization';
import TileBase from './TileBase/index';

const ValidDashboardChartTile: FC<{ data: SavedQuery; project: string }> = ({
    data,
    project,
}) => {
    const chartRef = useRef<EChartsReact>(null);
    const [activeVizTab, setActiveVizTab] = useState<DBChartTypes>(
        DBChartTypes.COLUMN,
    );
    const { data: resultData, isLoading } = useSavedChartResults(project, data);
    const chartConfig = useChartConfig(
        data.tableName,
        resultData,
        data?.chartConfig.seriesLayout,
    );

    useEffect(() => {
        if (data?.chartConfig.chartType) {
            setActiveVizTab(data.chartConfig.chartType);
        }
    }, [data]);

    return (
        <LightdashVisualization
            chartRef={chartRef}
            chartType={activeVizTab}
            chartConfig={chartConfig}
            resultsData={resultData}
            tableName={data.tableName}
            isLoading={isLoading}
        />
    );
};

const InvalidDashboardChartTile: FC = () => (
    <NonIdealState
        title="No chart available"
        description="Chart might have been deleted or you don't have permissions to see it."
        icon="search"
    />
);

type Props = Pick<
    React.ComponentProps<typeof TileBase>,
    'tile' | 'onEdit' | 'onDelete' | 'isEditMode'
> & { tile: IDashboardChartTile };

const DashboardChartTile: FC<Props> = (props) => {
    const {
        tile: {
            properties: { savedChartUuid },
        },
    } = props;
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { data: savedQuery, isLoading } = useSavedQuery({
        id: savedChartUuid || undefined,
    });
    const { data: explore } = useExplore(savedQuery?.tableName);
    const { dashboardFilters } = useDashboardContext();
    // START DASHBOARD FILTER LOGIC
    // TODO: move this logic out of component
    let savedQueryWithDashboardFilters: SavedQuery | undefined;
    if (savedQuery) {
        const tables = explore ? Object.keys(explore.tables) : [];
        const dimensionFilters: FilterGroup = {
            id: 'yes',
            and: [
                ...(savedQuery.metricQuery.filters.dimensions
                    ? [savedQuery.metricQuery.filters.dimensions]
                    : []),
                ...dashboardFilters.dimensions.filter((filter) =>
                    tables.includes(filter.target.tableName),
                ),
            ],
        };
        const metricFilters: FilterGroup = {
            id: 'no',
            and: [
                ...(savedQuery.metricQuery.filters.metrics
                    ? [savedQuery.metricQuery.filters.metrics]
                    : []),
                ...dashboardFilters.metrics.filter((filter) =>
                    tables.includes(filter.target.tableName),
                ),
            ],
        };
        savedQueryWithDashboardFilters = {
            ...savedQuery,
            metricQuery: {
                ...savedQuery.metricQuery,
                filters: {
                    dimensions: dimensionFilters,
                    metrics: metricFilters,
                },
            },
        };
    }
    // END DASHBOARD FILTER LOGIC

    const filterObj =
        savedQueryWithDashboardFilters?.metricQuery.filters.dimensions;
    // @ts-ignore
    const hasFilters = filterObj && filterObj.and.length > 0;

    return (
        <TileBase
            isChart
            hasFilters={!!hasFilters}
            title={savedQueryWithDashboardFilters?.name || ''}
            isLoading={isLoading}
            extraMenuItems={
                savedChartUuid !== null && (
                    <>
                        <MenuItem
                            icon="document-open"
                            text="Edit chart"
                            href={`/projects/${projectUuid}/saved/${savedChartUuid}`}
                        />
                    </>
                )
            }
            {...props}
        >
            <div style={{ flex: 1 }}>
                {savedQueryWithDashboardFilters ? (
                    <ValidDashboardChartTile
                        data={savedQueryWithDashboardFilters}
                        project={projectUuid}
                    />
                ) : (
                    <InvalidDashboardChartTile />
                )}
            </div>
        </TileBase>
    );
};

export default DashboardChartTile;
