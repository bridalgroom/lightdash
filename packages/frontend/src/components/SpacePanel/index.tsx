import { Button } from '@blueprintjs/core';
import { Breadcrumbs2 } from '@blueprintjs/popover2';
import { LightdashMode, Space } from '@lightdash/common';
import React, { useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import {
    useCreateMutation,
    useDeleteMutation,
    useUpdateDashboardName,
} from '../../hooks/dashboard/useDashboard';
import { useApp } from '../../providers/AppProvider';
import ActionCardList from '../common/ActionCardList';
import AddToSpaceModal from '../common/modal/AddToSpaceModal';
import DashboardForm from '../SavedDashboards/DashboardForm';
import SavedQueriesContent from '../SavedQueries/SavedQueriesContent';
import { SpacePanelWrapper, Title } from './SpacePanel.styles';
interface Props {
    space: Space;
}
export const DEFAULT_DASHBOARD_NAME = 'Untitled dashboard';

export const SpacePanel: React.FC<Props> = ({ space }) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { user, health } = useApp();
    const useDelete = useDeleteMutation();
    const isDemo = health.data?.mode === LightdashMode.DEMO;
    const {
        data: newDashboard,
        isLoading: isCreatingDashboard,
        mutate: createDashboard,
        isSuccess: hasCreatedDashboard,
    } = useCreateMutation(projectUuid);
    const history = useHistory();
    const savedCharts = space.queries;
    const savedDashboards = space.dashboards;

    const [addToSpace, setAddToSpace] = useState<string>();

    if (hasCreatedDashboard && newDashboard) {
        return (
            <Redirect
                push
                to={`/projects/${projectUuid}/dashboards/${newDashboard.uuid}`}
            />
        );
    }

    return (
        <SpacePanelWrapper>
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
                    { text: space.name, disabled: true, icon: 'folder-close' },
                ]}
            />
            <Title>{space.name}</Title>

            <ActionCardList
                title="Dashboards"
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
                            text="Add"
                            loading={isCreatingDashboard}
                            onClick={() => setAddToSpace('dashboards')}
                            intent="primary"
                        />
                    )
                }
            />

            <SavedQueriesContent
                savedQueries={savedCharts || []}
                projectUuid={projectUuid}
                isChart
                headerAction={
                    user.data?.ability?.can('manage', 'Dashboard') &&
                    !isDemo && (
                        <Button
                            text="Add"
                            loading={isCreatingDashboard}
                            onClick={() => setAddToSpace('charts')}
                            intent="primary"
                        />
                    )
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
