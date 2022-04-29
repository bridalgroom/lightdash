import { IconName } from '@blueprintjs/core';
import {
    ApiError,
    ApiRefreshResults,
    Job,
    JobStatusType,
    JobStep,
    JobStepStatusType,
} from 'common';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import { useApp } from '../providers/AppProvider';
import useQueryError from './useQueryError';

export const jobStepStatusLabel = (
    status: JobStepStatusType,
): { label: string; icon: IconName } => {
    switch (status) {
        case JobStepStatusType.DONE:
            return { label: 'Completed', icon: 'tick-circle' };
        case JobStepStatusType.PENDING:
            return { label: 'Pending', icon: 'pause' };
        case JobStepStatusType.SKIPPED:
            return { label: 'Skipped', icon: 'fast-forward' };
        case JobStepStatusType.ERROR:
            return { label: 'Error', icon: 'warning-sign' };
        case JobStepStatusType.RUNNING:
            return { label: 'Running', icon: 'refresh' };
        default:
            throw new Error('Unknown job step status');
    }
};
export const jobStatusLabel = (
    status: JobStatusType,
): { label: string; icon: IconName } => {
    switch (status) {
        case JobStatusType.DONE:
            return {
                label: 'Successfully synced dbt project!',
                icon: 'tick-circle',
            };
        case JobStatusType.STARTED:
            return { label: 'Pending sync', icon: 'pause' };
        case JobStatusType.ERROR:
            return {
                label: 'Error while syncing dbt project',
                icon: 'warning-sign',
            };
        case JobStatusType.RUNNING:
            return { label: 'Syncing dbt project', icon: 'refresh' };
        default:
            throw new Error('Unknown job status');
    }
};

export const runningStepsInfo = (steps: JobStep[]) => {
    const runningStep = steps.find((step) => {
        return step.stepStatus === 'RUNNING';
    });
    const numberOfCompletedSteps = steps.filter((step) => {
        return step.stepStatus === 'DONE';
    }).length;
    const completedStepsMessage = `${numberOfCompletedSteps}/${steps.length}`;
    const runningStepMessage = `Step ${numberOfCompletedSteps + 1}/${
        steps.length
    }: ${runningStep?.stepLabel}`;

    return {
        runningStep,
        numberOfCompletedSteps,
        completedStepsMessage,
        runningStepMessage,
        totalSteps: steps.length,
    };
};

export const TOAST_KEY_FOR_REFRESH_JOB = 'refresh-job';

const refresh = async (projectUuid: string) =>
    lightdashApi<ApiRefreshResults>({
        method: 'POST',
        url: `/projects/${projectUuid}/refresh`,
        body: undefined,
    });

const getJob = async (jobUuid: string) =>
    lightdashApi<Job>({
        method: 'GET',
        url: `/jobs/${jobUuid}`,
        body: undefined,
    });

export const useJob = (jobId: string | undefined) => {
    return useQuery<Job, ApiError>({
        queryKey: ['job', jobId],
        queryFn: () => getJob(jobId || ''),
        enabled: !!jobId,
        refetchInterval: (data) => data?.jobStatus === 'RUNNING' && 500,
        onSuccess: (data) => {
            if (data.jobStatus === 'DONE' || data.jobStatus === 'ERROR') {
                jobId = undefined;
            }
        },
        onError: (result) => result,
    });
};

export const useRefreshServer = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const setErrorResponse = useQueryError();
    const { setActiveJobId, showToastError } = useApp();
    return useMutation<ApiRefreshResults, ApiError>({
        mutationKey: ['refresh', projectUuid],
        mutationFn: () => refresh(projectUuid),
        onSettled: async () =>
            queryClient.setQueryData(['status', projectUuid], 'loading'),
        onSuccess: (data) => setActiveJobId(data.jobUuid),
        onError: (result) =>
            showToastError({
                title: 'Error syncing dbt project',
                subtitle: result.error.message,
            }),
    });
};
