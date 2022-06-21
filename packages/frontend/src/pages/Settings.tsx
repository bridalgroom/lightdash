import { Collapse, NonIdealState, Spinner } from '@blueprintjs/core';
import React, { Children, FC, useEffect, useMemo, useState } from 'react';
import {
    Redirect,
    Route,
    Switch,
    useLocation,
    useParams,
} from 'react-router-dom';
import Content from '../components/common/Page/Content';
import PageWithSidebar from '../components/common/Page/PageWithSidebar';
import Sidebar from '../components/common/Page/Sidebar';
import RouterMenuItem from '../components/common/RouterMenuItem';
import AccessTokensPanel from '../components/UserSettings/AccessTokensPanel';
import AppearancePanel from '../components/UserSettings/AppearancePanel';
import OrganisationPanel from '../components/UserSettings/OrganisationPanel';
import PasswordPanel from '../components/UserSettings/PasswordPanel';
import ProfilePanel from '../components/UserSettings/ProfilePanel';
import ProjectManagementPanel from '../components/UserSettings/ProjectManagementPanel';
import SocialLoginsPanel from '../components/UserSettings/SocialLoginsPanel';
import UserManagementPanel from '../components/UserSettings/UserManagementPanel';
import { useOrganisation } from '../hooks/organisation/useOrganisation';
import { useProject } from '../hooks/useProject';
import { useApp } from '../providers/AppProvider';
import {
    CardContainer,
    CollapseTrigger,
    ContentWrapper,
    ExpandableWrapper,
    SettingsItems,
    SidebarMenu,
    Title,
} from './Settings.styles';

interface ExpandableSectionProps {
    label: string;
}

const ExpandableSection: FC<ExpandableSectionProps> = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { pathname } = useLocation();

    useEffect(() => {
        Children.forEach(children, (element) => {
            if (!React.isValidElement(element)) return;
            if (pathname === element.props.to) {
                setIsOpen(true);
            }
        });
    });

    return (
        <ExpandableWrapper>
            <CollapseTrigger
                icon={isOpen ? 'chevron-down' : 'chevron-right'}
                text={label}
                minimal
                onClick={() => setIsOpen((prev) => !prev)}
            />
            <Collapse isOpen={isOpen}>
                <SettingsItems>{children}</SettingsItems>
            </Collapse>
        </ExpandableWrapper>
    );
};

const Settings: FC = () => {
    const { health, user } = useApp();
    const allowPasswordAuthentication =
        !health.data?.auth.disablePasswordAuthentication;
    const { data: orgData } = useOrganisation();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { isLoading, data, error } = useProject(projectUuid);

    const basePath = useMemo(
        () => `/projects/${projectUuid}/generalSettings`,
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
            <Sidebar title="Settings" noMargin>
                <SidebarMenu>
                    <ExpandableSection label="User settings">
                        <RouterMenuItem text="Profile" exact to={basePath} />
                        {allowPasswordAuthentication && (
                            <RouterMenuItem
                                text="Password"
                                exact
                                to={`${basePath}/password`}
                            />
                        )}
                        {health.data?.auth.google.oauth2ClientId && (
                            <RouterMenuItem
                                text="Social logins"
                                exact
                                to={`${basePath}/socialLogins`}
                            />
                        )}
                        {orgData && (
                            <RouterMenuItem
                                text="Personal access tokens"
                                exact
                                to={`${basePath}/personalAccessTokens`}
                            />
                        )}
                    </ExpandableSection>
                    <ExpandableSection label="Organization settings">
                        {user.data?.ability?.can('manage', 'Organization') && (
                            <RouterMenuItem
                                text="Organization"
                                exact
                                to={`${basePath}/organization`}
                            />
                        )}
                        {user.data?.ability?.can(
                            'view',
                            'OrganizationMemberProfile',
                        ) && (
                            <RouterMenuItem
                                text="User management"
                                to={`${basePath}/userManagement`}
                            />
                        )}
                        {orgData &&
                            !orgData.needsProject &&
                            user.data?.ability?.can('manage', 'Project') && (
                                <RouterMenuItem
                                    text="Project management"
                                    exact
                                    to={`${basePath}/projectManagement`}
                                />
                            )}
                        {orgData &&
                            !orgData.needsProject &&
                            user.data?.ability?.can('manage', 'Project') && (
                                <RouterMenuItem
                                    text="Appearance"
                                    exact
                                    to={`${basePath}/appearance`}
                                />
                            )}
                    </ExpandableSection>
                </SidebarMenu>
            </Sidebar>

            <Switch>
                {allowPasswordAuthentication && (
                    <Route
                        exact
                        path="/projects/:projectUuid/generalSettings/password"
                    >
                        <Content>
                            <CardContainer>
                                <Title>Password settings</Title>
                                <PasswordPanel />
                            </CardContainer>
                        </Content>
                    </Route>
                )}
                {health.data?.auth.google.oauth2ClientId && (
                    <Route
                        exact
                        path="/projects/:projectUuid/generalSettings/socialLogins"
                    >
                        <Content>
                            <CardContainer>
                                <Title>Social logins</Title>
                                <SocialLoginsPanel />
                            </CardContainer>
                        </Content>
                    </Route>
                )}
                {user.data?.ability?.can('manage', 'Organization') && (
                    <Route
                        exact
                        path="/projects/:projectUuid/generalSettings/organization"
                    >
                        <Content>
                            <CardContainer>
                                <Title>Organization settings</Title>
                                <OrganisationPanel />
                            </CardContainer>
                        </Content>
                    </Route>
                )}
                {user.data?.ability?.can(
                    'view',
                    'OrganizationMemberProfile',
                ) && (
                    <Route path="/projects/:projectUuid/generalSettings/userManagement">
                        <Content>
                            <ContentWrapper>
                                <UserManagementPanel />
                            </ContentWrapper>
                        </Content>
                    </Route>
                )}
                {orgData &&
                    !orgData.needsProject &&
                    user.data?.ability?.can('manage', 'Project') && (
                        <Route
                            exact
                            path="/projects/:projectUuid/generalSettings/projectManagement"
                        >
                            <Content>
                                <ContentWrapper>
                                    <ProjectManagementPanel />
                                </ContentWrapper>
                            </Content>
                        </Route>
                    )}
                {orgData &&
                    !orgData.needsProject &&
                    user.data?.ability?.can('manage', 'Project') && (
                        <Route
                            exact
                            path="/projects/:projectUuid/generalSettings/appearance"
                        >
                            <Content>
                                <CardContainer>
                                    <Title>Appearance settings</Title>
                                    <AppearancePanel />
                                </CardContainer>
                            </Content>
                        </Route>
                    )}
                {orgData && (
                    <Route
                        exact
                        path="/projects/:projectUuid/generalSettings/personalAccessTokens"
                    >
                        <Content>
                            <ContentWrapper>
                                <AccessTokensPanel />
                            </ContentWrapper>
                        </Content>
                    </Route>
                )}
                <Route exact path="/projects/:projectUuid/generalSettings">
                    <Content>
                        <CardContainer>
                            <Title>Profile settings</Title>
                            <ProfilePanel />
                        </CardContainer>
                    </Content>
                </Route>
                <Redirect to={basePath} />
            </Switch>
        </PageWithSidebar>
    );
};

export default Settings;
