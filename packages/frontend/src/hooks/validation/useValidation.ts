import {
    ApiError,
    ApiJobScheduledResponse,
    ValidationResponse,
} from '@lightdash/common';
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { lightdashApi } from '../../api';
import { useErrorLogs } from '../../providers/ErrorLogsProvider';
import { pollJobStatus } from '../scheduler/useScheduler';
import useToaster from '../toaster/useToaster';

const getValidation = async (
    projectUuid: string,
): Promise<ValidationResponse[]> =>
    lightdashApi<ValidationResponse[]>({
        url: `/projects/${projectUuid}/validate`,
        method: 'GET',
        body: undefined,
    });

export const useValidation = (projectUuid: string) =>
    useQuery<ValidationResponse[], ApiError>({
        queryKey: 'validation',
        queryFn: () => getValidation(projectUuid),
    });

const updateValidation = async (
    projectUuid: string,
): Promise<ApiJobScheduledResponse['results']> =>
    lightdashApi<ApiJobScheduledResponse['results']>({
        url: `/projects/${projectUuid}/validate`,
        method: 'POST',
        body: undefined,
    });

export const useValidationMutation = (projectUuid: string) => {
    const queryClient = useQueryClient();
    const { showError } = useErrorLogs();
    const { showToastSuccess } = useToaster();

    return useMutation<ApiJobScheduledResponse['results'], ApiError>({
        mutationKey: ['validation', projectUuid],
        mutationFn: () => updateValidation(projectUuid),
        onSuccess: (data) => {
            // Wait until validation is complete
            pollJobStatus(data.jobId)
                .then(() => {
                    // Invalidate validation to get latest results
                    queryClient.invalidateQueries({ queryKey: ['validation'] });
                    showToastSuccess({ title: 'Validation completed' });
                })
                .catch((error: Error) => {
                    showError({
                        title: 'Unable to update validation',
                        body: error.message,
                    });
                });
        },
        onError: useCallback(
            (error) => {
                const [title, ...rest] = error.error.message.split('\n');
                showError({
                    title,
                    body: rest.join('\n'),
                });
            },
            [showError],
        ),
    });
};
