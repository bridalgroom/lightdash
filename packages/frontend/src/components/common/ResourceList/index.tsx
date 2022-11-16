import { IconName } from '@blueprintjs/core';
import {
    assertUnreachable,
    DashboardBasicDetails,
    SpaceQuery,
} from '@lightdash/common';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUpdateDashboardName } from '../../../hooks/dashboard/useDashboard';
import useMoveToSpace from '../../../hooks/useMoveToSpace';
import { useUpdateMutation } from '../../../hooks/useSavedQuery';
import AddTilesToDashboardModal from '../../SavedDashboards/AddTilesToDashboardModal';
import DashboardForm from '../../SavedDashboards/DashboardForm';
import SavedQueryForm from '../../SavedQueries/SavedQueryForm';
import { ActionTypeModal } from '../modal/ActionModal';
import DeleteActionModal from '../modal/DeleteActionModal';
import UpdateActionModal from '../modal/UpdateActionModal';
import SpaceActionModal, { ActionType } from '../SpaceActionModal';
import ResourceEmptyState from './ResourceEmptyState';
import ResourceListWrapper, {
    ResourceListWrapperProps,
} from './ResourceListWrapper';
import ResourceTable, { ResourceTableCommonProps } from './ResourceTable';

export type AcceptedResources = SpaceQuery | DashboardBasicDetails;
export type AcceptedResourceTypes = 'chart' | 'dashboard';

interface ActionStateWithData {
    actionType: ActionTypeModal;
    data?: any;
}

export interface ResourceListCommonProps<
    T extends AcceptedResources = AcceptedResources,
> {
    headerTitle?: string;
    headerAction?: React.ReactNode;
    resourceList: T[];
    resourceType: AcceptedResourceTypes;
    resourceIcon: IconName;
    showCount?: boolean;
    getURL: (data: T) => string;
    onClickCTA?: () => void;
}

type ResourceListProps = ResourceListCommonProps &
    ResourceTableCommonProps &
    ResourceListWrapperProps;

const ResourceList: React.FC<ResourceListProps> = ({
    headerTitle,
    headerAction,
    resourceIcon,
    resourceList,
    resourceType,
    enableSorting,
    enableMultiSort,
    defaultColumnVisibility,
    defaultSort,
    showCount = true,
    getURL,
    onClickCTA,
}) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();

    const [actionState, setActionState] = useState<ActionStateWithData>({
        actionType: ActionTypeModal.CLOSE,
    });

    const { moveChart, moveDashboard } = useMoveToSpace(
        resourceType === 'chart',
        actionState.data,
    );

    const actions = useMemo(() => {
        switch (resourceType) {
            case 'dashboard':
                return {
                    update: useUpdateDashboardName,
                    moveToSpace: moveDashboard,
                };
            case 'chart':
                return {
                    update: useUpdateMutation,
                    moveToSpace: moveChart,
                };
            default:
                return assertUnreachable(
                    resourceType,
                    'Unexpected resource type',
                );
        }
    }, [moveChart, moveDashboard, resourceType]);

    useEffect(() => {
        if (
            actionState.actionType === ActionTypeModal.MOVE_TO_SPACE &&
            actionState.data
        ) {
            actions.moveToSpace(actionState.data);
        }
    }, [actionState, actions]);

    return (
        <>
            <ResourceListWrapper
                headerTitle={headerTitle}
                headerAction={headerAction}
                resourceCount={resourceList.length}
                showCount={showCount}
            >
                {resourceList.length === 0 ? (
                    <ResourceEmptyState
                        resourceIcon={resourceIcon}
                        resourceType={resourceType}
                        headerAction={headerAction}
                        onClickCTA={onClickCTA}
                    />
                ) : (
                    <ResourceTable
                        resourceType={resourceType}
                        resourceIcon={resourceIcon}
                        resourceList={resourceList}
                        enableSorting={enableSorting}
                        enableMultiSort={enableMultiSort}
                        defaultColumnVisibility={defaultColumnVisibility}
                        defaultSort={defaultSort}
                        getURL={getURL}
                        onChangeAction={setActionState}
                    />
                )}
            </ResourceListWrapper>

            {actionState.actionType === ActionTypeModal.UPDATE &&
                (resourceType === 'chart' ? (
                    <UpdateActionModal
                        icon={resourceIcon}
                        resourceType={resourceType}
                        useActionModalState={[actionState, setActionState]}
                        useUpdate={actions.update}
                        ModalContent={SavedQueryForm}
                    />
                ) : (
                    <UpdateActionModal
                        icon={resourceIcon}
                        resourceType={resourceType}
                        useActionModalState={[actionState, setActionState]}
                        useUpdate={actions.update}
                        ModalContent={DashboardForm}
                    />
                ))}
            {actionState.actionType === ActionTypeModal.DELETE &&
                actionState.data && (
                    <DeleteActionModal
                        isOpen={
                            actionState.actionType === ActionTypeModal.DELETE
                        }
                        onClose={() => {
                            setActionState({
                                actionType: ActionTypeModal.CLOSE,
                            });
                        }}
                        uuid={actionState.data.uuid}
                        name={actionState.data.name}
                        isChart={resourceType === 'chart'}
                    />
                )}

            {actionState.actionType === ActionTypeModal.ADD_TO_DASHBOARD && (
                <AddTilesToDashboardModal
                    savedChart={actionState.data}
                    isOpen={
                        actionState.actionType ===
                        ActionTypeModal.ADD_TO_DASHBOARD
                    }
                    onClose={() =>
                        setActionState({ actionType: ActionTypeModal.CLOSE })
                    }
                />
            )}

            {actionState.actionType === ActionTypeModal.CREATE_SPACE &&
                actionState.data && (
                    <SpaceActionModal
                        projectUuid={projectUuid}
                        actionType={ActionType.CREATE}
                        title="Create new space"
                        confirmButtonLabel="Create"
                        icon="folder-close"
                        onClose={() =>
                            setActionState({
                                actionType: ActionTypeModal.CLOSE,
                            })
                        }
                        onSubmitForm={(space) => {
                            if (space && actionState.data) {
                                actions.moveToSpace({
                                    uuid: actionState.data.uuid,
                                    name: actionState.data.name,
                                    spaceUuid: space.uuid,
                                });
                            }
                        }}
                    />
                )}
        </>
    );
};

export default ResourceList;
