import { ApiQueryResults, Field } from '@lightdash/common';
import React, { FC } from 'react';
import useUnderlyingDataColumns from '../../hooks/useUnderlyingDataColumns';
import { TrackSection } from '../../providers/TrackingProvider';
import { SectionName } from '../../types/Events';
import Table from '../common/Table';
import {
    TableHeaderBoldLabel,
    TableHeaderLabelContainer,
    TableHeaderRegularLabel,
} from '../common/Table/Table.styles';
import { TableContainer } from '../Explorer/ResultsCard/ResultsCard.styles';

const UnderlyingDataResultsTable: FC<{
    fieldsMap: Record<string, Field>;
    resultsData: ApiQueryResults | undefined;
    hasJoins?: boolean;
}> = ({ fieldsMap, resultsData, hasJoins }) => {
    const columnHeader = (dimension: Field) => (
        <TableHeaderLabelContainer>
            {hasJoins === true && (
                <TableHeaderRegularLabel>
                    {dimension.tableLabel} -{' '}
                </TableHeaderRegularLabel>
            )}

            <TableHeaderBoldLabel>{dimension.label}</TableHeaderBoldLabel>
        </TableHeaderLabelContainer>
    );

    const columns = useUnderlyingDataColumns({
        resultsData,
        fieldsMap,
        columnHeader,
    });

    return (
        <TrackSection name={SectionName.RESULTS_TABLE}>
            <TableContainer>
                <Table
                    status={'success'}
                    data={resultsData?.rows || []}
                    columns={columns}
                    pagination={{
                        show: true,
                        defaultScroll: true,
                    }}
                    footer={{
                        show: true,
                    }}
                />
            </TableContainer>
        </TrackSection>
    );
};

export default UnderlyingDataResultsTable;
