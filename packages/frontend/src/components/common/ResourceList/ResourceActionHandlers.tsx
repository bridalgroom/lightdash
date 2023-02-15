import { assertUnreachable, Space } from '@lightdash/common';
import { FC, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    useDuplicateDashboardMutation,
    useMoveDashboardMutation,
} from '../../../hooks/dashboard/useDashboard';
import { useChartPinningMutation } from '../../../hooks/pinning/useChartPinningMutation';
import { useDashboardPinningMutation } from '../../../hooks/pinning/useDashboardPinningMutation';
import {
    useDuplicateChartMutation,
    useMoveChartMutation,
} from '../../../hooks/useSavedQuery';
import AddTilesToDashboardModal from '../../SavedDashboards/AddTilesToDashboardModal';
import ChartDeleteModal from '../modal/ChartDeleteModal';
import ChartUpdateModal from '../modal/ChartUpdateModal';
import DashboardDeleteModal from '../modal/DashboardDeleteModal';
import DashboardUpdateModal from '../modal/DashboardUpdateModal';
import SpaceActionModal, { ActionType } from '../SpaceActionModal';
import { ResourceListItem, ResourceListType } from './ResourceTypeUtils';

export enum ResourceListAction {
    CLOSE,
    UPDATE,
    DELETE,
    DUPLICATE,
    ADD_TO_DASHBOARD,
    CREATE_SPACE,
    MOVE_TO_SPACE,
    PIN_TO_HOMEPAGE,
}

export type ResourceListActionState =
    | { type: ResourceListAction.CLOSE }
    | { type: ResourceListAction.UPDATE; item: ResourceListItem }
    | { type: ResourceListAction.DELETE; item: ResourceListItem }
    | { type: ResourceListAction.DUPLICATE; item: ResourceListItem }
    | { type: ResourceListAction.ADD_TO_DASHBOARD; item: ResourceListItem }
    | { type: ResourceListAction.CREATE_SPACE; item: ResourceListItem }
    | { type: ResourceListAction.PIN_TO_HOMEPAGE; item: ResourceListItem }
    | {
          type: ResourceListAction.MOVE_TO_SPACE;
          item: ResourceListItem;
          data: { spaceUuid: string };
      };

interface ResourceActionHandlersProps {
    action: ResourceListActionState;
    onAction: (action: ResourceListActionState) => void;
}

const ResourceActionHandlers: FC<ResourceActionHandlersProps> = ({
    action,
    onAction,
}) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();

    const { mutate: moveChartMutation } = useMoveChartMutation();
    const { mutate: moveDashboardMutation } = useMoveDashboardMutation();
    const { mutate: duplicateChart } = useDuplicateChartMutation({
        showRedirectButton: true,
    });
    const { mutate: duplicateDashboard } = useDuplicateDashboardMutation({
        showRedirectButton: true,
    });
    const { mutate: pinChart } = useChartPinningMutation();
    const { mutate: pinDashboard } = useDashboardPinningMutation();

    const handleReset = useCallback(() => {
        onAction({ type: ResourceListAction.CLOSE });
    }, [onAction]);

    const handleCreateSpace = useCallback(
        (space: Space | undefined) => {
            if (!space) return;
            if (action.type !== ResourceListAction.CREATE_SPACE) return;

            onAction({
                type: ResourceListAction.MOVE_TO_SPACE,
                item: action.item,
                data: { spaceUuid: space.uuid },
            });
        },
        [onAction, action],
    );

    const handleMoveToSpace = useCallback(() => {
        if (action.type !== ResourceListAction.MOVE_TO_SPACE) return;

        switch (action.item.type) {
            case ResourceListType.CHART:
                return moveChartMutation({
                    uuid: action.item.data.uuid,
                    name: action.item.data.name,
                    ...action.data,
                });
            case ResourceListType.DASHBOARD:
                return moveDashboardMutation({
                    uuid: action.item.data.uuid,
                    name: action.item.data.name,
                    ...action.data,
                });
            case ResourceListType.SPACE:
                throw new Error('Cannot move a space to another space');
            default:
                return assertUnreachable(
                    action.item,
                    'Resource type not supported',
                );
        }
    }, [action, moveChartMutation, moveDashboardMutation]);

    const handlePinToHomepage = useCallback(() => {
        if (action.type !== ResourceListAction.PIN_TO_HOMEPAGE) return;

        switch (action.item.type) {
            case ResourceListType.CHART:
                return pinChart({
                    uuid: action.item.data.uuid,
                });
            case ResourceListType.DASHBOARD:
                return pinDashboard({
                    uuid: action.item.data.uuid,
                });
            case ResourceListType.SPACE:
                throw new Error('Cannot pin a space to homepage');
            default:
                return assertUnreachable(
                    action.item,
                    'Resource type not supported',
                );
        }
    }, [action, pinChart, pinDashboard]);

    const handleDuplicate = useCallback(() => {
        if (action.type !== ResourceListAction.DUPLICATE) return;

        switch (action.item.type) {
            case ResourceListType.CHART:
                return duplicateChart(action.item.data.uuid);
            case ResourceListType.DASHBOARD:
                return duplicateDashboard(action.item.data.uuid);
            case ResourceListType.SPACE:
                throw new Error('Cannot duplicate a space');
            default:
                return assertUnreachable(
                    action.item,
                    'Resource type not supported',
                );
        }
    }, [action, duplicateChart, duplicateDashboard]);

    useEffect(() => {
        if (action.type === ResourceListAction.MOVE_TO_SPACE) {
            handleMoveToSpace();
            handleReset();
        }
    }, [action, handleMoveToSpace, handleReset]);

    useEffect(() => {
        if (action.type === ResourceListAction.DUPLICATE) {
            handleDuplicate();
            handleReset();
        }
    }, [action, handleDuplicate, handleReset]);

    useEffect(() => {
        if (action.type === ResourceListAction.PIN_TO_HOMEPAGE) {
            handlePinToHomepage();
            handleReset();
        }
    }, [action, handlePinToHomepage, handleReset]);

    switch (action.type) {
        case ResourceListAction.UPDATE:
            switch (action.item.type) {
                case ResourceListType.CHART:
                    return (
                        <ChartUpdateModal
                            isOpen
                            uuid={action.item.data.uuid}
                            onClose={handleReset}
                            onConfirm={handleReset}
                        />
                    );
                case ResourceListType.DASHBOARD:
                    return (
                        <DashboardUpdateModal
                            isOpen
                            uuid={action.item.data.uuid}
                            onClose={handleReset}
                            onConfirm={handleReset}
                        />
                    );
                case ResourceListType.SPACE:
                    throw new Error('Cannot update a space');
                default:
                    return assertUnreachable(
                        action.item,
                        'Action type not supported',
                    );
            }
        case ResourceListAction.DELETE:
            switch (action.item.type) {
                case ResourceListType.CHART:
                    return (
                        <ChartDeleteModal
                            isOpen
                            uuid={action.item.data.uuid}
                            onClose={handleReset}
                            onConfirm={handleReset}
                        />
                    );
                case ResourceListType.DASHBOARD:
                    return (
                        <DashboardDeleteModal
                            isOpen
                            uuid={action.item.data.uuid}
                            onClose={handleReset}
                            onConfirm={handleReset}
                        />
                    );
                case ResourceListType.SPACE:
                    throw new Error('Cannot delete a space');
                default:
                    return assertUnreachable(
                        action.item,
                        'Resource type not supported',
                    );
            }
        case ResourceListAction.ADD_TO_DASHBOARD:
            switch (action.item.type) {
                case ResourceListType.CHART:
                    return (
                        <AddTilesToDashboardModal
                            savedChart={action.item.data}
                            isOpen
                            onClose={handleReset}
                        />
                    );
                case ResourceListType.DASHBOARD:
                case ResourceListType.SPACE:
                    throw new Error(
                        `Cannot add a ${action.item.type} to a dashboard`,
                    );
            }
        case ResourceListAction.CREATE_SPACE:
            switch (action.item.type) {
                case ResourceListType.CHART:
                case ResourceListType.DASHBOARD:
                    return (
                        <SpaceActionModal
                            shouldRedirect={false}
                            projectUuid={projectUuid}
                            actionType={ActionType.CREATE}
                            title="Create new space"
                            confirmButtonLabel="Create"
                            icon="folder-close"
                            onClose={handleReset}
                            onSubmitForm={handleCreateSpace}
                        />
                    );
                case ResourceListType.SPACE:
                    throw new Error('Cannot create a space inside a space');
            }
        case ResourceListAction.CLOSE:
        case ResourceListAction.DUPLICATE:
        case ResourceListAction.MOVE_TO_SPACE:
        case ResourceListAction.PIN_TO_HOMEPAGE:
            return null;
        default:
            return assertUnreachable(action, 'action type not supported');
    }
};

export default ResourceActionHandlers;
