import { ApiError, OrganizationProject, ProjectType } from '@lightdash/common';
import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from 'react-query';
import { lightdashApi } from '../api';
import useToaster from './toaster/useToaster';

const getProjectsQuery = async () =>
    lightdashApi<OrganizationProject[]>({
        url: `/org/projects`,
        method: 'GET',
        body: undefined,
    });

export const useProjects = (
    useQueryOptions?: UseQueryOptions<OrganizationProject[], ApiError>,
) => {
    return useQuery<OrganizationProject[], ApiError>({
        queryKey: ['projects'],
        queryFn: getProjectsQuery,
        ...useQueryOptions,
    });
};

const LAST_PROJECT_KEY = 'lastProject';

export const useActiveProject = () => {
    return useQuery<string | undefined>({
        queryKey: ['activeProject'],
        queryFn: () =>
            Promise.resolve(
                localStorage.getItem(LAST_PROJECT_KEY) || undefined,
            ),
    });
};

export const useUpdateActiveProjectMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (projectUuid) => {
            return Promise.resolve(
                localStorage.setItem(LAST_PROJECT_KEY, projectUuid),
            );
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries('activeProject');
        },
    });
};

export const useDeleteActiveProjectMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error>({
        mutationFn: () => {
            return Promise.resolve(localStorage.removeItem(LAST_PROJECT_KEY));
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries('activeProject');
        },
    });
};

export const useDefaultProject = () => {
    const query = useProjects();

    const defaultProject = query.data?.find(
        ({ type }) => type === ProjectType.DEFAULT,
    );

    return {
        ...query,
        data: defaultProject || query.data?.[0],
    };
};

const deleteProjectQuery = async (id: string) =>
    lightdashApi<undefined>({
        url: `/org/projects/${id}`,
        method: 'DELETE',
        body: undefined,
    });

export const useDeleteProjectMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, string>(deleteProjectQuery, {
        mutationKey: ['organization_project_delete'],
        onSuccess: async () => {
            await queryClient.invalidateQueries('projects');
            showToastSuccess({
                title: `Deleted! Project was deleted.`,
            });
        },
        onError: (error) => {
            showToastError({
                title: `Failed to delete project`,
                subtitle: error.error.message,
            });
        },
    });
};
