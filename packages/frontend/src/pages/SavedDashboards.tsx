import { Button, NonIdealState, Spinner } from '@blueprintjs/core';
import React from 'react';
import { Redirect, useParams } from 'react-router-dom';
import ActionCardList from '../components/common/ActionCardList';
import Page from '../components/common/Page/Page';
import DashboardForm from '../components/SavedDashboards/DashboardForm';
import {
    useCreateMutation,
    useDeleteMutation,
    useUpdateDashboard,
} from '../hooks/dashboard/useDashboard';
import { useDashboards } from '../hooks/dashboard/useDashboards';

export const DEFAULT_DASHBOARD_NAME = 'Untitled dashboard';

const SavedDashboards = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { isLoading, data: dashboards = [] } = useDashboards(projectUuid);
    const useDelete = useDeleteMutation();
    const {
        isLoading: isCreatingDashboard,
        isSuccess: hasCreatedDashboard,
        mutate: createDashboard,
        data: newDashboard,
    } = useCreateMutation(projectUuid);

    if (isLoading) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState title="Loading dashboards" icon={<Spinner />} />
            </div>
        );
    }

    if (hasCreatedDashboard && newDashboard) {
        return (
            <Redirect
                push
                to={`/projects/${projectUuid}/dashboards/${newDashboard.uuid}`}
            />
        );
    }

    return (
        <Page>
            <ActionCardList
                title="Dashboards"
                useUpdate={useUpdateDashboard}
                useDelete={useDelete}
                dataList={dashboards}
                getURL={(savedDashboard) => {
                    const { uuid } = savedDashboard;
                    return `/projects/${projectUuid}/dashboards/${uuid}/view`;
                }}
                ModalContent={DashboardForm}
                headerAction={
                    <Button
                        text="Create dashboard"
                        loading={isCreatingDashboard}
                        onClick={() =>
                            createDashboard({
                                name: DEFAULT_DASHBOARD_NAME,
                                tiles: [],
                                filters: {
                                    dimensions: [],
                                    metrics: [],
                                },
                            })
                        }
                        intent="primary"
                    />
                }
            />
        </Page>
    );
};

export default SavedDashboards;
