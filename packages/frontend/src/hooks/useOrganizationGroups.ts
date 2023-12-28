import { ApiError, CreateGroup, Group } from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { lightdashApi } from '../api';
import useToaster from './toaster/useToaster';
import useQueryError from './useQueryError';

const getOrganizationGroupsQuery = async () =>
    lightdashApi<Group[]>({
        url: `/org/groups`,
        method: 'GET',
        body: undefined,
    });

export const useOrganizationGroups = () => {
    const setErrorResponse = useQueryError();
    return useQuery<Group[], ApiError>({
        queryKey: ['organization_groups'],
        queryFn: getOrganizationGroupsQuery,
        onError: (result) => setErrorResponse(result),
    });
};

const createGroupQuery = async (data: CreateGroup) =>
    lightdashApi<Group>({
        url: `/org/groups`,
        method: 'POST',
        body: JSON.stringify(data),
    });

export const useGroupCreateMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<Group, ApiError, CreateGroup>(
        (data) => createGroupQuery(data),
        {
            mutationKey: ['create_group'],
            onSuccess: async (_) => {
                await queryClient.invalidateQueries(['create_group']);
                await queryClient.invalidateQueries(['organization_groups']);

                showToastSuccess({
                    title: `Success! Group was created.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to create group`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

const deleteGroupQuery = async (data: Group) =>
    lightdashApi<Group>({
        url: `/groups/${data.uuid}`,
        method: 'DELETE',
        body: undefined,
    });

export const useGroupDeleteMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<Group, ApiError, Group>(
        (data) => deleteGroupQuery(data),
        {
            mutationKey: ['delete_group'],
            onSuccess: async (_, deletedGroup) => {
                await queryClient.invalidateQueries(['delete_group']);
                await queryClient.invalidateQueries(['organization_groups']);

                showToastSuccess({
                    title: `Success! Group ${deletedGroup.name} was deleted.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to delete group`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};
