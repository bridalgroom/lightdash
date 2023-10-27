import { ApiError, SchedulerAndTargets } from '@lightdash/common';
import { Loader, Stack, Text, Title } from '@mantine/core';
import React, { FC, useState } from 'react';
import { UseQueryResult } from 'react-query/types/react/types';
import ErrorState from '../../../components/common/ErrorState';
import { SchedulerDeleteModal } from './SchedulerDeleteModal';
import SchedulersListItem from './SchedulersListItem';

type Props = {
    schedulersQuery: UseQueryResult<SchedulerAndTargets[], ApiError>;
    onEdit: (schedulerUuid: string) => void;
};

const SchedulersList: FC<Props> = ({ schedulersQuery, onEdit }) => {
    const { data: schedulers, isLoading, error } = schedulersQuery;
    const [schedulerUuid, setSchedulerUuid] = useState<string>();

    if (isLoading) {
        return (
            <Stack h={300} w="100%" align="center">
                <Text fw={600}>Loading schedulers</Text>
                <Loader size="lg" />
            </Stack>
        );
    }
    if (error) {
        return <ErrorState error={error.error} />;
    }
    if (!schedulers || schedulers.length <= 0) {
        return (
            <Stack color="gray" align="center" mt="xxl">
                <Title order={4} color="gray.6">
                    There are no existing scheduled deliveries
                </Title>
                <Text color="gray.6">
                    Add one by clicking on "Create new" below
                </Text>
            </Stack>
        );
    }
    return (
        <div>
            {schedulers.map((scheduler) => (
                <SchedulersListItem
                    key={scheduler.schedulerUuid}
                    scheduler={scheduler}
                    onEdit={onEdit}
                    onDelete={setSchedulerUuid}
                />
            ))}
            {schedulerUuid && (
                <SchedulerDeleteModal
                    isOpen={true}
                    schedulerUuid={schedulerUuid}
                    onConfirm={() => setSchedulerUuid(undefined)}
                    onClose={() => setSchedulerUuid(undefined)}
                />
            )}
        </div>
    );
};

export default SchedulersList;
