import {
    ApiError,
    OrganizationMemberProfile,
    OrganizationMemberProfileUpdate,
} from '@lightdash/common';
import Fuse from 'fuse.js';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { lightdashApi } from '../api';
import { useApp } from '../providers/AppProvider';
import useToaster from './toaster/useToaster';
import useQueryError from './useQueryError';

const getOrganizationUsersQuery = async () =>
    lightdashApi<OrganizationMemberProfile[]>({
        url: `/org/users`,
        method: 'GET',
        body: undefined,
    });

const deleteUserQuery = async (id: string) =>
    lightdashApi<undefined>({
        url: `/org/user/${id}`,
        method: 'DELETE',
        body: undefined,
    });

const updateUser = async (id: string, data: OrganizationMemberProfileUpdate) =>
    lightdashApi<undefined>({
        url: `/org/users/${id}`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });

export const useOrganizationUsers = (searchInput?: string) => {
    const setErrorResponse = useQueryError();
    return useQuery<OrganizationMemberProfile[], ApiError>({
        queryKey: ['organization_users'],
        queryFn: getOrganizationUsersQuery,
        onError: (result) => setErrorResponse(result),
        select: (data) => {
            if (searchInput) {
                return new Fuse(Object.values(data), {
                    keys: ['firstName', 'lastName', 'email', 'role'],
                    ignoreLocation: true,
                    threshold: 0.3,
                })
                    .search(searchInput)
                    .map((result) => result.item);
            }
            return data;
        },
    });
};

export const useDeleteOrganizationUserMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, string>(deleteUserQuery, {
        mutationKey: ['saved_query_create'],
        onSuccess: async () => {
            await queryClient.invalidateQueries('organization_users');
            showToastSuccess({
                title: `Success! User was deleted.`,
            });
        },
        onError: (error) => {
            showToastError({
                title: `Failed to delete user`,
                subtitle: error.error.message,
            });
        },
    });
};

export const useUpdateUserMutation = (userUuid: string) => {
    const queryClient = useQueryClient();
    const { user } = useApp();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, OrganizationMemberProfileUpdate>(
        (data) => {
            if (userUuid) {
                return updateUser(userUuid, data);
            }
            throw new Error('user ID is undefined');
        },
        {
            mutationKey: ['organization_membership_roles'],
            onSuccess: async () => {
                if (user.data?.userUuid === userUuid) {
                    await queryClient.refetchQueries('user');
                }
                await queryClient.refetchQueries('organization_users');
                showToastSuccess({
                    title: `Success! User was updated.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to update user's permissions`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};
