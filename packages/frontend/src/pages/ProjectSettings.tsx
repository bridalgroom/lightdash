import {
    Colors,
    Divider,
    H3,
    Menu,
    MenuDivider,
    NonIdealState,
    Spinner,
} from '@blueprintjs/core';
import { subject } from '@casl/ability';
import React, { FC, useMemo, useState } from 'react';
import { Redirect, Route, Switch, useParams } from 'react-router-dom';
import { Can } from '../components/common/Authorization';
import Content from '../components/common/Page/Content';
import PageWithSidebar from '../components/common/Page/PageWithSidebar';
import Sidebar from '../components/common/Page/Sidebar';
import RouterMenuItem from '../components/common/RouterMenuItem';
import ProjectAccess from '../components/ProjectAccess/ProjectAccess';
import ProjectAccessCreation from '../components/ProjectAccess/ProjectAccessCreation';
import { UpdateProjectConnection } from '../components/ProjectConnection';
import ProjectTablesConfiguration from '../components/ProjectTablesConfiguration/ProjectTablesConfiguration';
import { useProject } from '../hooks/useProject';
import {
    ProjectConnectionContainer,
    Title,
    UpdateHeaderWrapper,
    UpdateProjectWrapper,
} from './ProjectSettings.styles';

const ProjectSettings: FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { isLoading, data, error } = useProject(projectUuid);

    const [projectAccessCreate, setProjectAccessCreate] =
        useState<boolean>(false);
    const basePath = useMemo(
        () => `/projects/${projectUuid}/settings`,
        [projectUuid],
    );

    if (error) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState
                    title="Error loading project"
                    description={error.error.message}
                />
            </div>
        );
    }

    if (isLoading || !data) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState title="Loading project" icon={<Spinner />} />
            </div>
        );
    }
    return (
        <PageWithSidebar>
            <Sidebar title="Project settings" noMargin>
                <Menu>
                    <RouterMenuItem
                        text="Project connections"
                        exact
                        to={basePath}
                    />
                    <MenuDivider />
                    <RouterMenuItem
                        text="Tables configuration"
                        exact
                        to={`${basePath}/tablesConfiguration`}
                    />
                    <Can
                        I="manage"
                        this={subject('Project', {
                            organizationUuid: data.organizationUuid,
                            projectUuid,
                        })}
                    >
                        <MenuDivider />
                        <RouterMenuItem
                            text="Project access"
                            exact
                            to={`${basePath}/projectAccess`}
                        />
                    </Can>
                </Menu>
            </Sidebar>

            <Switch>
                <Route
                    exact
                    path="/projects/:projectUuid/settings/tablesConfiguration"
                >
                    <Content>
                        <H3 style={{ marginTop: 10, marginBottom: 0 }}>
                            Your project has connected successfully! 🎉
                        </H3>
                        <Divider style={{ margin: '20px 0' }} />
                        <p
                            style={{
                                marginBottom: 20,
                                color: Colors.GRAY1,
                            }}
                        >
                            Before you start exploring your data, pick the dbt
                            models you wanto to appear as tables in Lightdash.
                            You can always adjust this in your project settings
                            later.
                        </p>
                        <ProjectTablesConfiguration projectUuid={projectUuid} />
                    </Content>
                </Route>

                <Route exact path="/projects/:projectUuid/settings">
                    <ProjectConnectionContainer>
                        <UpdateProjectWrapper>
                            <UpdateHeaderWrapper>
                                <Title marginBottom>
                                    Edit your project connection
                                </Title>
                            </UpdateHeaderWrapper>
                            <UpdateProjectConnection
                                projectUuid={projectUuid}
                            />
                        </UpdateProjectWrapper>
                    </ProjectConnectionContainer>
                </Route>
                <Can
                    I="manage"
                    this={subject('Project', {
                        organizationUuid: data.organizationUuid,
                        projectUuid,
                    })}
                >
                    <Route
                        exact
                        path="/projects/:projectUuid/settings/projectAccess"
                    >
                        <Content>
                            <Title>
                                Project access (only visible to Project Admins)
                            </Title>
                            {projectAccessCreate ? (
                                <ProjectAccessCreation
                                    onBackClick={() => {
                                        setProjectAccessCreate(false);
                                    }}
                                />
                            ) : (
                                <ProjectAccess
                                    onAddUser={() => {
                                        setProjectAccessCreate(true);
                                    }}
                                />
                            )}
                        </Content>
                    </Route>
                </Can>
                <Redirect to={basePath} />
            </Switch>
        </PageWithSidebar>
    );
};

export default ProjectSettings;
