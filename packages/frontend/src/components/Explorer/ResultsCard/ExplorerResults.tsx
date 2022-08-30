import { Button, Colors } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import React, { FC, ReactNode } from 'react';
import { useColumns } from '../../../hooks/useColumns';
import { useExplore } from '../../../hooks/useExplore';
import { useExplorer } from '../../../providers/ExplorerProvider';
import { TrackSection } from '../../../providers/TrackingProvider';
import { SectionName } from '../../../types/Events';
import Table from '../../common/Table';
import { HeaderProps, TableColumn } from '../../common/Table/types';
import CellContextMenu from './CellContextMenu';
import ColumnHeaderContextMenu from './ColumnHeaderContextMenu';
import {
    EmptyStateExploreLoading,
    EmptyStateNoColumns,
    EmptyStateNoTableData,
    NoTableSelected,
} from './ExplorerResultsNonIdealStates';
import { TableContainer } from './ResultsCard.styles';

const HeaderButton: React.FC<HeaderProps> = ({ header }) => {
    const {
        actions: { removeActiveField },
    } = useExplorer();
    const meta = header.column.columnDef.meta as TableColumn['meta'];

    if (meta?.isInvalidItem) {
        return (
            <Tooltip2 content="Remove">
                <Button
                    minimal
                    small
                    icon="cross"
                    onClick={() => {
                        removeActiveField(header.column.id);
                    }}
                />
            </Tooltip2>
        );
    }
    return null;
};

export const ExplorerResults = () => {
    const columns = useColumns();
    const {
        state: {
            isEditMode,
            unsavedChartVersion: {
                tableName: activeTableName,
                metricQuery: { dimensions, metrics },
                tableConfig: { columnOrder: explorerColumnOrder },
            },
        },
        queryResults: { data: resultsData, status },
        actions: { setColumnOrder },
    } = useExplorer();
    const activeExplore = useExplore(activeTableName);

    if (!activeTableName) return <NoTableSelected />;

    if (activeExplore.isLoading) return <EmptyStateExploreLoading />;

    if (columns.length === 0) return <EmptyStateNoColumns />;

    const IdleState: FC = () => {
        let description: ReactNode =
            'Run query to view your results and visualize them as a chart.';
        if (dimensions.length <= 0) {
            description = (
                <>
                    Pick one or more{' '}
                    <span style={{ color: Colors.BLUE1 }}>dimensions</span> to
                    split your selected metric by.
                </>
            );
        } else if (metrics.length <= 0) {
            description = (
                <>
                    Pick a <span style={{ color: Colors.ORANGE1 }}>metric</span>{' '}
                    to make calculations across your selected dimensions.
                </>
            );
        }

        return <EmptyStateNoTableData description={description} />;
    };

    return (
        <TrackSection name={SectionName.RESULTS_TABLE}>
            <TableContainer>
                <Table
                    status={status}
                    data={resultsData?.rows || []}
                    columns={columns}
                    columnOrder={explorerColumnOrder}
                    onColumnOrderChange={setColumnOrder}
                    cellContextMenu={(props) => (
                        <CellContextMenu isEditMode={isEditMode} {...props} />
                    )}
                    headerContextMenu={
                        isEditMode ? ColumnHeaderContextMenu : undefined
                    }
                    headerButton={isEditMode ? HeaderButton : undefined}
                    idleState={IdleState}
                    pagination={{
                        show: true,
                    }}
                    footer={{
                        show: true,
                    }}
                />
            </TableContainer>
        </TrackSection>
    );
};
