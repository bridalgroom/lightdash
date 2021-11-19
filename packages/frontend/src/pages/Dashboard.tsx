import { Spinner } from '@blueprintjs/core';
import { Dashboard as IDashboard, DashboardTileTypes } from 'common';
import React, { useEffect, useState } from 'react';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { useParams } from 'react-router-dom';
import DashboardHeader from '../components/common/Dashboard/DashboardHeader';
import ChartTile from '../components/DashboardTiles/DashboardChartTile';
import LoomTile from '../components/DashboardTiles/DashboardLoomTile';
import MarkdownTile from '../components/DashboardTiles/DashboardMarkdownTile';
import EmptyStateNoTiles from '../components/DashboardTiles/EmptyStateNoTiles';
import {
    useDashboardQuery,
    useUpdateDashboard,
} from '../hooks/dashboard/useDashboard';
import '../styles/react-grid.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = () => {
    const { dashboardUuid } = useParams<{ dashboardUuid: string }>();
    const { data: dashboard } = useDashboardQuery(dashboardUuid);
    const [hasTilesChanged, setHasTilesChanged] = useState(false);
    const {
        mutate,
        isSuccess,
        reset,
        isLoading: isSaving,
    } = useUpdateDashboard(dashboardUuid);
    const [dashboardTiles, setTiles] = useState<IDashboard['tiles']>([]);
    const tileProperties = Object.fromEntries(
        dashboardTiles.map((tile) => [tile.uuid, tile]) || [],
    );

    useEffect(() => {
        setTiles(dashboard?.tiles || []);
    }, [dashboard]);

    useEffect(() => {
        if (isSuccess) {
            setHasTilesChanged(false);
            reset();
        }
    }, [isSuccess, reset]);

    const updateTiles = (layout: Layout[]) => {
        const tiles = layout.map((tile) => ({
            ...tileProperties[tile.i],
            uuid: tile.i,
            x: tile.x,
            y: tile.y,
            h: tile.h,
            w: tile.w,
        }));
        setTiles(tiles);
        setHasTilesChanged(true);
    };
    if (dashboard === undefined) {
        return <Spinner />;
    }
    const onAddTile = (tile: IDashboard['tiles'][number]) => {
        setHasTilesChanged(true);
        setTiles([...dashboardTiles, tile]);
    };
    return (
        <>
            <DashboardHeader
                dashboardName={dashboard.name}
                isSaving={isSaving}
                hasTilesChanged={hasTilesChanged}
                onAddTile={onAddTile}
                onSaveDashboard={() => mutate({ tiles: dashboardTiles })}
                onSaveTitle={(name) => mutate({ name })}
            />
            <ResponsiveGridLayout
                useCSSTransforms={false}
                draggableCancel=".non-draggable"
                onDragStop={(layout) => updateTiles(layout)}
                onResizeStop={(layout) => updateTiles(layout)}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 10, sm: 6 }}
                layouts={{
                    lg: dashboardTiles.map((tile) => ({
                        ...tile,
                        i: tile.uuid,
                    })),
                }}
            >
                {dashboardTiles.map((tile) => {
                    const onDelete = () => {
                        setTiles(
                            dashboardTiles.filter(
                                (filteredTile) =>
                                    filteredTile.uuid !== tile.uuid,
                            ),
                        );
                        setHasTilesChanged(true);
                    };
                    const onEdit = (
                        updatedTile: IDashboard['tiles'][number],
                    ) => {
                        setTiles(
                            dashboardTiles.map((t) =>
                                t.uuid === tile.uuid ? updatedTile : t,
                            ),
                        );
                        setHasTilesChanged(true);
                    };
                    return (
                        <div key={tile.uuid}>
                            {tile.type === DashboardTileTypes.SAVED_CHART && (
                                <ChartTile
                                    tile={tile}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                />
                            )}
                            {tile.type === DashboardTileTypes.MARKDOWN && (
                                <MarkdownTile
                                    tile={tile}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                />
                            )}
                            {tile.type === DashboardTileTypes.LOOM && (
                                <LoomTile
                                    tile={tile}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                />
                            )}
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
            {dashboardTiles.length <= 0 && (
                <EmptyStateNoTiles onAddTile={onAddTile} />
            )}
        </>
    );
};
export default Dashboard;
