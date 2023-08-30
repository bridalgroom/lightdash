import { NonIdealState, Spinner } from '@blueprintjs/core';
import { Button, Group, Stack, Text } from '@mantine/core';
import { useCallback, useEffect } from 'react';
import ErrorState from '../../../../../../components/common/ErrorState';
import { useScheduler } from '../../../../../../hooks/scheduler/useScheduler';
import { useSchedulersDeleteMutation } from '../../../../../../hooks/scheduler/useSchedulersDeleteMutation';
import {
    SyncWithGoogleSheetsModalAction,
    useSyncWithGoogleSheetsModal,
} from '../../hooks/use-sync-with-google-sheets-modal-provider';

export const SyncModalDelete = () => {
    const { currentSchedulerUuid, setAction } = useSyncWithGoogleSheetsModal();
    const scheduler = useScheduler(currentSchedulerUuid ?? '');
    const {
        mutate: deleteScheduler,
        isLoading,
        isSuccess: isSchedulerDeleteSuccessful,
    } = useSchedulersDeleteMutation();

    useEffect(() => {
        if (isSchedulerDeleteSuccessful) {
            setAction(SyncWithGoogleSheetsModalAction.VIEW);
        }
    }, [isSchedulerDeleteSuccessful, setAction]);

    const handleConfirm = useCallback(() => {
        if (!currentSchedulerUuid) return;
        deleteScheduler(currentSchedulerUuid);
    }, [deleteScheduler, currentSchedulerUuid]);

    if (scheduler.isLoading || scheduler.error) {
        return scheduler.isLoading ? (
            <NonIdealState title="Loading sync" icon={<Spinner />} />
        ) : (
            <ErrorState error={scheduler.error.error} />
        );
    }

    return (
        <Stack spacing="lg">
            <Text>
                Are you sure you want to delete <b>"{scheduler.data?.name}"</b>?
            </Text>

            <Group position="apart">
                <Button
                    variant="outline"
                    color="gray"
                    onClick={() =>
                        setAction(SyncWithGoogleSheetsModalAction.VIEW)
                    }
                >
                    Cancel
                </Button>

                {scheduler.isSuccess && (
                    <Button
                        color="red"
                        loading={isLoading}
                        onClick={handleConfirm}
                    >
                        Delete
                    </Button>
                )}
            </Group>
        </Stack>
    );
};
