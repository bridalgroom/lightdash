import { ApiError, ApiRefreshResults, Job } from 'common';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import { useApp } from '../providers/AppProvider';
import useQueryError from './useQueryError';

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

export const useGetRefreshData = (jobId: string | undefined) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { showToastSuccess } = useApp();
    const setErrorResponse = useQueryError();
    return useQuery<Job, ApiError>({
        queryKey: ['refresh', projectUuid],
        queryFn: () => getJob(jobId || ''),
        enabled: jobId !== undefined,
        refetchInterval: (data) => data?.jobStatus === 'RUNNING' && 1000,
        onSuccess: async (data) => {
            if (data.jobStatus === 'DONE') {
                showToastSuccess({
                    title: `Sync successful!`,
                });
            }
        },
        onError: (result) => setErrorResponse(result),
        refetchIntervalInBackground: false,
        refetchOnMount: false,
    });
};

export const useRefreshServer = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const setErrorResponse = useQueryError();

    return useMutation<ApiRefreshResults, ApiError>({
        mutationKey: ['refresh', projectUuid],
        mutationFn: () => refresh(projectUuid),
        onSettled: async () => queryClient.setQueryData('status', 'loading'),
        onError: (result) => setErrorResponse(result),
    });
};
