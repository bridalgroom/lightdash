import { ApiError, OrganizationProject, ProjectType } from '@lightdash/common';
import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from 'react-query';
import { lightdashApi } from '../api';
import { useOrganization } from './organization/useOrganization';
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

export const useDefaultProject = (): {
    isLoading: boolean;
    data: OrganizationProject | undefined;
} => {
    const { isLoading: isOrganizationLoading, data: org } = useOrganization();
    const { isLoading: isLoadingProjects, data: projects = [] } = useProjects();

    const defaultProject = projects?.find(
        (project) => project.projectUuid === org?.defaultProjectUuid,
    );

    const fallbackProject = projects?.find(
        ({ type }) => type === ProjectType.DEFAULT,
    );

    return {
        isLoading: isOrganizationLoading || isLoadingProjects,
        data: defaultProject || fallbackProject || projects?.[0],
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
