import { NonIdealState, Spinner } from '@blueprintjs/core';
import {
    CreateSchedulerAndTargetsWithoutIds,
    SchedulerFormat,
    UpdateSchedulerAndTargetsWithoutId,
} from '@lightdash/common';
import {
    Box,
    Button,
    Group,
    Input,
    Space,
    Stack,
    TextInput,
} from '@mantine/core';
import { IconCirclesRelation } from '@tabler/icons-react';
import { FC, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ErrorState from '../../../../../components/common/ErrorState';
import MantineIcon from '../../../../../components/common/MantineIcon';
import CronInput from '../../../../../components/ReactHookForm/CronInput';
import { useChartSchedulerCreateMutation } from '../../../../../hooks/scheduler/useChartSchedulers';
import { useScheduler } from '../../../../../hooks/scheduler/useScheduler';
import { useSchedulersUpdateMutation } from '../../../../../hooks/scheduler/useSchedulersUpdateMutation';
import { isInvalidCronExpression } from '../../../../../utils/fieldValidators';
import { SelectGoogleSheetButton } from '../SelectGoogleSheetButton';
import {
    SyncWithGoogleSheetsModalAction,
    useSyncWithGoogleSheetsModal,
} from './providers/SyncWithGoogleSheetsModalProvider';

export const SyncModalForm: FC<{ chartUuid: string }> = ({ chartUuid }) => {
    const { action, setAction, currentSchedulerUuid } =
        useSyncWithGoogleSheetsModal();

    const isEditing = action === SyncWithGoogleSheetsModalAction.EDIT;
    const {
        data: schedulerData,
        isLoading: isLoadingSchedulerData,
        isError: isSchedulerError,
        error: schedulerError,
    } = useScheduler(
        currentSchedulerUuid ?? '',
        !!currentSchedulerUuid && isEditing,
    );

    const {
        mutate: updateChartSync,
        isLoading: isUpdateChartSyncLoading,
        isSuccess: isUpdateChartSyncSuccess,
    } = useSchedulersUpdateMutation(currentSchedulerUuid ?? '');
    const {
        mutate: createChartSync,
        isLoading: isCreateChartSyncLoading,
        isSuccess: isCreateChartSyncSuccess,
    } = useChartSchedulerCreateMutation();

    const isLoading = isCreateChartSyncLoading || isUpdateChartSyncLoading;
    const isSuccess = isCreateChartSyncSuccess || isUpdateChartSyncSuccess;

    const methods = useForm<CreateSchedulerAndTargetsWithoutIds>({
        mode: 'onSubmit',
        defaultValues: {
            cron: '0 9 * * *',
            name: '',
            options: {
                gdriveId: '',
                gdriveName: '',
                gdriveOrganizationName: '',
                url: '',
            },
        },
    });

    useEffect(() => {
        if (schedulerData && isEditing) {
            methods.reset(schedulerData);
        }
    }, [isEditing, methods, schedulerData]);

    const handleSubmit = (
        data:
            | CreateSchedulerAndTargetsWithoutIds
            | UpdateSchedulerAndTargetsWithoutId,
    ) => {
        const defaultNewSchedulerValues = {
            format: SchedulerFormat.GSHEETS,
            targets: [],
        };

        if (isEditing) {
            updateChartSync({
                ...data,
                ...defaultNewSchedulerValues,
            });
            return;
        }

        createChartSync({
            resourceUuid: chartUuid,
            data: {
                ...data,
                ...defaultNewSchedulerValues,
            },
        });
    };

    useEffect(() => {
        if (isSuccess) {
            methods.reset();
            setAction(SyncWithGoogleSheetsModalAction.VIEW);
        }
    }, [isSuccess, methods, setAction]);

    const hasSetGoogleSheet = methods.watch('options.gdriveId') !== '';

    if (isEditing && (isLoadingSchedulerData || isSchedulerError)) {
        return isLoadingSchedulerData ? (
            <NonIdealState title="Loading scheduler" icon={<Spinner />} />
        ) : (
            <ErrorState error={schedulerError.error} />
        );
    }
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="Name the Sync"
                        required
                        {...methods.register('name')}
                    />
                    <Input.Wrapper label="Set the frequency" required>
                        <Box>
                            <CronInput
                                name="cron"
                                defaultValue="0 9 * * 1"
                                rules={{
                                    required: 'Required field',
                                    validate: {
                                        isValidCronExpression:
                                            isInvalidCronExpression(
                                                'Cron expression',
                                            ),
                                    },
                                }}
                            />
                        </Box>
                    </Input.Wrapper>

                    <SelectGoogleSheetButton />

                    <Space />

                    <Group position="apart">
                        <Button
                            variant="outline"
                            loading={isLoading}
                            onClick={() =>
                                setAction(SyncWithGoogleSheetsModalAction.VIEW)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            display="block"
                            ml="auto"
                            type="submit"
                            disabled={!hasSetGoogleSheet}
                            loading={isLoading}
                            leftIcon={
                                !isEditing && (
                                    <MantineIcon icon={IconCirclesRelation} />
                                )
                            }
                        >
                            {isEditing ? 'Save changes' : 'Sync'}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </FormProvider>
    );
};
