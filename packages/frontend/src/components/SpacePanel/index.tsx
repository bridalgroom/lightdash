import { Button, NonIdealState } from '@blueprintjs/core';
import { Breadcrumbs2 } from '@blueprintjs/popover2';
import { LightdashMode, Space } from '@lightdash/common';
import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    useDeleteMutation,
    useUpdateDashboardName,
} from '../../hooks/dashboard/useDashboard';
import { useApp } from '../../providers/AppProvider';
import ActionCardList from '../common/ActionCardList';
import AddToSpaceModal from '../common/modal/AddToSpaceModal';
import DashboardForm from '../SavedDashboards/DashboardForm';
import SavedQueriesContent from '../SavedQueries/SavedQueriesContent';
import {
    BreadcrumbsWrapper,
    EmptyStateIcon,
    EmptyStateText,
    EmptyStateWrapper,
    SpacePanelWrapper,
} from './SpacePanel.styles';

interface Props {
    space: Space;
}
export const DEFAULT_DASHBOARD_NAME = 'Untitled dashboard';

export const SpacePanel: React.FC<Props> = ({ space }) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { user, health } = useApp();
    const useDelete = useDeleteMutation();
    const isDemo = health.data?.mode === LightdashMode.DEMO;
    const history = useHistory();
    const savedCharts = space.queries;
    const savedDashboards = space.dashboards;

    const [addToSpace, setAddToSpace] = useState<string>();

    return (
        <SpacePanelWrapper>
            <BreadcrumbsWrapper>
                <Breadcrumbs2
                    items={[
                        {
                            href: '/home',
                            text: 'Home',
                            className: 'home-breadcrumb',
                            onClick: (e) => {
                                e.preventDefault();
                                history.push('/home');
                            },
                        },
                        { text: space.name },
                    ]}
                />
            </BreadcrumbsWrapper>

            <ActionCardList
                title={`Dashboards (${savedDashboards.length})`}
                useUpdate={useUpdateDashboardName}
                useDelete={useDelete}
                dataList={savedDashboards}
                getURL={(savedDashboard) => {
                    const { uuid } = savedDashboard;
                    return `/projects/${projectUuid}/dashboards/${uuid}/view`;
                }}
                ModalContent={DashboardForm}
                headerAction={
                    user.data?.ability?.can('manage', 'Dashboard') &&
                    !isDemo && (
                        <Button
                            text="Add dashboard"
                            onClick={() => setAddToSpace('dashboards')}
                            intent="primary"
                        />
                    )
                }
                emptyBody={
                    <NonIdealState
                        description={
                            <EmptyStateWrapper>
                                <EmptyStateIcon icon="control" size={50} />
                                <EmptyStateText>
                                    No dashboards added yet
                                </EmptyStateText>
                                <p>Hit 'Add dashboard' to get started.</p>
                            </EmptyStateWrapper>
                        }
                    />
                }
            />

            <SavedQueriesContent
                title={`Saved charts (${savedCharts.length})`}
                savedQueries={savedCharts || []}
                projectUuid={projectUuid}
                headerAction={
                    user.data?.ability?.can('manage', 'SavedChart') &&
                    !isDemo && (
                        <Button
                            text="Add chart"
                            onClick={() => setAddToSpace('charts')}
                            intent="primary"
                        />
                    )
                }
                emptyBody={
                    <NonIdealState
                        description={
                            <EmptyStateWrapper>
                                <EmptyStateIcon icon="chart" size={50} />
                                <EmptyStateText>
                                    No charts added yet
                                </EmptyStateText>
                                <p>Hit 'Add chart' to get started.</p>
                            </EmptyStateWrapper>
                        }
                    />
                }
            />
            <AddToSpaceModal
                isOpen={addToSpace !== undefined}
                isChart={addToSpace === 'charts'}
                onClose={() => setAddToSpace(undefined)}
            />
        </SpacePanelWrapper>
    );
};

export default SpacePanel;
