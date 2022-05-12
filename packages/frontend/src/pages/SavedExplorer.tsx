import { Card, NonIdealState, Spinner } from '@blueprintjs/core';
import React from 'react';
import { useParams } from 'react-router-dom';
import Explorer from '../components/Explorer';
import ExplorePanel from '../components/Explorer/ExplorePanel/index';
import ExplorerHeader from '../components/Explorer/ExplorerHeader';
import { useSavedQuery } from '../hooks/useSavedQuery';
import {
    ExplorerProvider,
    ExplorerSection,
} from '../providers/ExplorerProvider';

const SavedExplorer = () => {
    const { savedQueryUuid } = useParams<{
        savedQueryUuid: string;
    }>();
    const { data, isLoading, error } = useSavedQuery({
        id: savedQueryUuid,
    });

    if (isLoading) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState title="Loading..." icon={<Spinner />} />
            </div>
        );
    }
    if (error) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState
                    title="Unexpected error"
                    description={error.error.message}
                />
            </div>
        );
    }

    return (
        <ExplorerProvider
            initialState={
                data
                    ? {
                          shouldFetchResults: true,
                          expandedSections: [
                              ExplorerSection.VISUALIZATION,
                              ExplorerSection.RESULTS,
                          ],
                          unsavedChartVersion: {
                              tableName: data.tableName,
                              chartConfig: data.chartConfig,
                              metricQuery: data.metricQuery,
                              tableConfig: data.tableConfig,
                              pivotConfig: data.pivotConfig,
                          },
                      }
                    : undefined
            }
            savedChart={data}
        >
            <ExplorerHeader />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    justifyContent: 'stretch',
                    alignItems: 'flex-start',
                }}
            >
                <Card
                    style={{
                        height: 'calc(100vh - 130px)',
                        flexBasis: '400px',
                        flexGrow: 0,
                        flexShrink: 0,
                        marginRight: '10px',
                        overflow: 'hidden',
                        position: 'sticky',
                        borderRadius: 0,
                        top: '130px',
                    }}
                    elevation={1}
                >
                    <div
                        style={{
                            height: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <ExplorePanel />
                    </div>
                </Card>
                <div
                    style={{
                        padding: '10px 10px',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        minWidth: 0,
                    }}
                >
                    <Explorer />
                </div>
            </div>
        </ExplorerProvider>
    );
};

export default SavedExplorer;
