import {
    ApiError,
    CreateSchedulerAndTargets,
    CreateSchedulerAndTargetsWithoutIds,
    ItemsMap,
    SchedulerAndTargets,
    UpdateSchedulerAndTargetsWithoutId,
} from '@lightdash/common';
import { Box, Loader, LoadingOverlay, Stack, Text } from '@mantine/core';
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { FC, useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import ErrorState from '../../../components/common/ErrorState';
import useUser from '../../../hooks/user/useUser';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import { useScheduler, useSendNowScheduler } from '../hooks/useScheduler';
import { useSchedulersUpdateMutation } from '../hooks/useSchedulersUpdateMutation';
import { getSchedulerUuidFromUrlParams } from '../utils';
import SchedulerForm from './SchedulerForm';
import SchedulersModalFooter from './SchedulerModalFooter';
import SchedulersList from './SchedulersList';

enum States {
    LIST,
    CREATE,
    EDIT,
}

const ListStateContent: FC<{
    schedulersQuery: UseQueryResult<SchedulerAndTargets[], ApiError>;
    isAlertList?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onEdit: (schedulerUuid: string) => void;
}> = ({ schedulersQuery, isAlertList, onClose, onConfirm, onEdit }) => {
    return (
        <>
            <Box
                py="sm"
                mih={220}
                px="sm"
                sx={(theme) => ({ backgroundColor: theme.colors.gray[2] })}
            >
                <SchedulersList
                    schedulersQuery={schedulersQuery}
                    isAlertList={isAlertList}
                    onEdit={onEdit}
                />
            </Box>
            <SchedulersModalFooter
                confirmText="Create new"
                onConfirm={onConfirm}
                onCancel={onClose}
            />
        </>
    );
};

const CreateStateContent: FC<{
    resourceUuid: string;
    createMutation: UseMutationResult<
        SchedulerAndTargets,
        ApiError,
        { resourceUuid: string; data: CreateSchedulerAndTargetsWithoutIds }
    >;
    isChart: boolean;
    isAlert?: boolean;
    itemsMap?: ItemsMap;
    onBack: () => void;
}> = ({ resourceUuid, createMutation, isChart, isAlert, itemsMap, onBack }) => {
    useEffect(() => {
        if (createMutation.isSuccess) {
            createMutation.reset();
            onBack();
        }
    }, [createMutation, createMutation.isSuccess, onBack]);
    const handleSubmit = (data: CreateSchedulerAndTargetsWithoutIds) => {
        createMutation.mutate({ resourceUuid, data });
    };
    const { data: user } = useUser(true);
    const { track } = useTracking();
    const { mutate: sendNow, isLoading: isLoadingSendNow } =
        useSendNowScheduler();

    const handleSendNow = useCallback(
        (schedulerData: CreateSchedulerAndTargetsWithoutIds) => {
            if (user?.userUuid === undefined) return;
            const resource = isChart
                ? {
                      savedChartUuid: resourceUuid,
                      dashboardUuid: null,
                  }
                : {
                      dashboardUuid: resourceUuid,
                      savedChartUuid: null,
                  };
            const unsavedScheduler: CreateSchedulerAndTargets = {
                ...schedulerData,
                ...resource,
                createdBy: user.userUuid,
            };
            track({
                name: EventName.SCHEDULER_SEND_NOW_BUTTON,
            });

            sendNow(unsavedScheduler);
        },
        [isChart, resourceUuid, track, sendNow, user],
    );

    return (
        <>
            <LoadingOverlay visible={isLoadingSendNow} overlayBlur={1} />
            <SchedulerForm
                disabled={createMutation.isLoading}
                resource={
                    isChart
                        ? {
                              uuid: resourceUuid,
                              type: 'chart',
                          }
                        : {
                              uuid: resourceUuid,
                              type: 'dashboard',
                          }
                }
                onSubmit={handleSubmit}
                confirmText={isAlert ? 'Create alert' : 'Create schedule'}
                onBack={onBack}
                onSendNow={handleSendNow}
                loading={createMutation.isLoading}
                isAlert={isAlert}
                itemsMap={itemsMap}
            />
        </>
    );
};

const UpdateStateContent: FC<{
    schedulerUuid: string;
    itemsMap?: ItemsMap;
    onBack: () => void;
}> = ({ schedulerUuid, itemsMap, onBack }) => {
    const scheduler = useScheduler(schedulerUuid);

    const mutation = useSchedulersUpdateMutation(schedulerUuid);
    useEffect(() => {
        if (mutation.isSuccess) {
            mutation.reset();
            onBack();
        }
    }, [mutation, mutation.isSuccess, onBack]);

    const handleSubmit = (data: UpdateSchedulerAndTargetsWithoutId) => {
        mutation.mutate(data);
    };

    const { data: user } = useUser(true);
    const { track } = useTracking();

    const { mutate: sendNow, isLoading: isLoadingSendNow } =
        useSendNowScheduler();

    const handleSendNow = useCallback(
        (schedulerData: CreateSchedulerAndTargetsWithoutIds) => {
            if (scheduler.data === undefined) return;
            if (user?.userUuid === undefined) return;
            const unsavedScheduler: CreateSchedulerAndTargets = {
                ...schedulerData,
                savedChartUuid: scheduler.data.savedChartUuid,
                dashboardUuid: scheduler.data.dashboardUuid,
                createdBy: user.userUuid,
            };

            track({
                name: EventName.SCHEDULER_SEND_NOW_BUTTON,
            });
            sendNow(unsavedScheduler);
        },
        [scheduler.data, user?.userUuid, track, sendNow],
    );

    if (scheduler.isInitialLoading || scheduler.error) {
        return (
            <>
                <Box m="xl">
                    {scheduler.isInitialLoading ? (
                        <Stack h={300} w="100%" align="center">
                            <Text fw={600}>Loading scheduler</Text>
                            <Loader size="lg" />
                        </Stack>
                    ) : scheduler.error ? (
                        <ErrorState error={scheduler.error.error} />
                    ) : null}
                </Box>
                <SchedulersModalFooter onBack={onBack} />
            </>
        );
    }
    return (
        <>
            <LoadingOverlay visible={isLoadingSendNow} overlayBlur={1} />
            <SchedulerForm
                resource={
                    scheduler.data &&
                    (scheduler.data.dashboardUuid ||
                        scheduler.data.savedChartUuid)
                        ? {
                              type: scheduler.data.dashboardUuid
                                  ? 'dashboard'
                                  : 'chart',
                              uuid:
                                  scheduler.data.dashboardUuid ??
                                  scheduler.data.savedChartUuid,
                          }
                        : undefined
                }
                disabled={mutation.isLoading}
                savedSchedulerData={scheduler.data}
                onSubmit={handleSubmit}
                confirmText="Save"
                onBack={onBack}
                onSendNow={handleSendNow}
                loading={mutation.isLoading || scheduler.isInitialLoading}
                itemsMap={itemsMap}
            />
        </>
    );
};

interface Props {
    resourceUuid: string;
    schedulersQuery: UseQueryResult<SchedulerAndTargets[], ApiError>;
    createMutation: UseMutationResult<
        SchedulerAndTargets,
        ApiError,
        { resourceUuid: string; data: CreateSchedulerAndTargetsWithoutIds }
    >;
    onClose: () => void;
    isChart: boolean;
    isAlert?: boolean;
    itemsMap?: ItemsMap;
}

const SchedulerModalContent: FC<Omit<Props, 'name'>> = ({
    resourceUuid,
    schedulersQuery,
    createMutation,
    isChart,
    isAlert,
    itemsMap,
    onClose = () => {},
}) => {
    const [state, setState] = useState<States>(States.LIST);
    const [schedulerUuid, setSchedulerUuid] = useState<string | undefined>();
    const history = useHistory();
    const { search, pathname } = useLocation();

    useEffect(() => {
        const schedulerUuidFromUrlParams =
            getSchedulerUuidFromUrlParams(search);
        if (schedulerUuidFromUrlParams) {
            setState(States.EDIT);
            setSchedulerUuid(schedulerUuidFromUrlParams);

            // remove from url param after modal is open
            const newParams = new URLSearchParams(search);
            newParams.delete('scheduler_uuid');
            history.replace({
                pathname,
                search: newParams.toString(),
            });
        }
    }, [history, pathname, search]);

    return (
        <>
            {state === States.LIST && (
                <ListStateContent
                    schedulersQuery={schedulersQuery}
                    onClose={onClose}
                    onConfirm={() => setState(States.CREATE)}
                    onEdit={(schedulerUuidToUpdate) => {
                        setState(States.EDIT);
                        setSchedulerUuid(schedulerUuidToUpdate);
                    }}
                    isAlertList={isAlert}
                />
            )}
            {state === States.CREATE && (
                <CreateStateContent
                    resourceUuid={resourceUuid}
                    createMutation={createMutation}
                    isChart={isChart}
                    itemsMap={itemsMap}
                    onBack={() => setState(States.LIST)}
                    isAlert={isAlert}
                />
            )}
            {state === States.EDIT && schedulerUuid && (
                <UpdateStateContent
                    schedulerUuid={schedulerUuid}
                    itemsMap={itemsMap}
                    onBack={() => setState(States.LIST)}
                />
            )}
        </>
    );
};

export default SchedulerModalContent;
