import {
    Button,
    ButtonGroup,
    Classes,
    Dialog,
    Intent,
} from '@blueprintjs/core';
import { subject } from '@casl/ability';
import { OrganizationProject, ProjectType } from '@lightdash/common';
import { Stack } from '@mantine/core';
import { FC, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import {
    useActiveProject,
    useDeleteActiveProjectMutation,
    useDeleteProjectMutation,
    useProjects,
} from '../../../hooks/useProjects';
import { useApp } from '../../../providers/AppProvider';
import { Can } from '../../common/Authorization';
import LinkButton from '../../common/LinkButton';
import { SettingsCard } from '../../common/Settings/SettingsCard';
import {
    HeaderActions,
    ItemContent,
    PanelTitle,
    ProjectInfo,
    ProjectManagementPanelWrapper,
    ProjectName,
    ProjectTag,
} from './ProjectManagementPanel.styles';

const ProjectListItem: FC<{
    isCurrentProject: boolean;
    project: OrganizationProject;
}> = ({ isCurrentProject, project: { projectUuid, name, type } }) => {
    const { user } = useApp();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { mutate: deleteProjectMutation, isLoading: isDeleting } =
        useDeleteProjectMutation();
    const { mutate: deleteLastProjectMutation } =
        useDeleteActiveProjectMutation();

    return (
        <SettingsCard shadow="sm">
            <ItemContent>
                <ProjectInfo>
                    <ProjectName
                        className={Classes.TEXT_OVERFLOW_ELLIPSIS}
                        title={name}
                    >
                        {name}
                    </ProjectName>
                    {isCurrentProject && (
                        <ProjectTag minimal>Current Project</ProjectTag>
                    )}
                    {type === ProjectType.PREVIEW && (
                        <ProjectTag minimal intent="warning">
                            Preview
                        </ProjectTag>
                    )}
                </ProjectInfo>

                <ButtonGroup>
                    <LinkButton
                        icon="cog"
                        outlined
                        text="Settings"
                        href={`/generalSettings/projectManagement/${projectUuid}`}
                    />
                    <Can
                        I="delete"
                        this={subject('Project', {
                            organizationUuid: user.data?.organizationUuid,
                            projectUuid,
                        })}
                    >
                        <Button
                            icon="trash"
                            outlined
                            text="Delete"
                            intent={Intent.DANGER}
                            style={{ marginLeft: 10 }}
                            onClick={() => setIsDeleteDialogOpen(true)}
                        />
                    </Can>
                </ButtonGroup>
            </ItemContent>

            <Dialog
                isOpen={isDeleteDialogOpen}
                icon="trash"
                onClose={() =>
                    !isDeleting ? setIsDeleteDialogOpen(false) : undefined
                }
                title={'Delete project ' + name}
                lazy
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>
                        Are you sure ? This will permanently delete the
                        <b> {name} </b> project.
                    </p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button
                            disabled={isDeleting}
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isDeleting}
                            intent="danger"
                            onClick={() => {
                                deleteProjectMutation(projectUuid);
                                if (isCurrentProject) {
                                    deleteLastProjectMutation();
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Dialog>
        </SettingsCard>
    );
};

const ProjectManagementPanel: FC = () => {
    const history = useHistory();
    const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
    const { data: lastProjectUuid, isLoading: isLoadingLastProject } =
        useActiveProject();

    if (isLoadingProjects || isLoadingLastProject) return null;

    if (projects.length === 0) {
        return <Redirect to="/createProject" />;
    }

    const lastProject = projects.find(
        (project) => project.projectUuid === lastProjectUuid,
    );

    return (
        <ProjectManagementPanelWrapper>
            <HeaderActions>
                <PanelTitle>Project management settings</PanelTitle>
                <Can I="create" a="Project">
                    <Button
                        intent="primary"
                        onClick={() => history.push(`/createProject`)}
                        text="Create new"
                    />
                </Can>
            </HeaderActions>

            <Stack>
                {projects.map((project) => (
                    <ProjectListItem
                        key={project.projectUuid}
                        isCurrentProject={
                            lastProject?.projectUuid === project.projectUuid
                        }
                        project={project}
                    />
                ))}
            </Stack>
        </ProjectManagementPanelWrapper>
    );
};

export default ProjectManagementPanel;
