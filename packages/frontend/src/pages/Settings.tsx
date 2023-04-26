import { subject } from '@casl/ability';
import { NavLink, Title } from '@mantine/core';
import {
    IconDatabase,
    IconKey,
    IconLock,
    IconPalette,
    IconPlug,
    IconUserCircle,
    IconUserPlus,
} from '@tabler/icons-react';
import { FC } from 'react';
import { Helmet } from 'react-helmet';
import {
    NavLink as RouterNavLink,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom';
import { Can } from '../components/common/Authorization';
import ErrorState from '../components/common/ErrorState';
import MantineIcon from '../components/common/MantineIcon';
import Content from '../components/common/Page/Content';
import { PageWithSidebar } from '../components/common/Page/Page.styles';
import Sidebar from '../components/common/Page/Sidebar';
import PageSpinner from '../components/PageSpinner';
import AccessTokensPanel from '../components/UserSettings/AccessTokensPanel';
import AllowedDomainsPanel from '../components/UserSettings/AllowedDomainsPanel';
import AppearancePanel from '../components/UserSettings/AppearancePanel';
import { DeleteOrganizationPanel } from '../components/UserSettings/DeleteOrganizationPanel';
import { Description } from '../components/UserSettings/DeleteOrganizationPanel/DeleteOrganizationPanel.styles';
import OrganizationPanel from '../components/UserSettings/OrganizationPanel';
import PasswordPanel from '../components/UserSettings/PasswordPanel';
import ProfilePanel from '../components/UserSettings/ProfilePanel';
import ProjectManagementPanel from '../components/UserSettings/ProjectManagementPanel';
import SlackSettingsPanel from '../components/UserSettings/SlackSettingsPanel';
import SocialLoginsPanel from '../components/UserSettings/SocialLoginsPanel';
import UserManagementPanel from '../components/UserSettings/UserManagementPanel';
import { useOrganization } from '../hooks/organization/useOrganization';
import { useApp } from '../providers/AppProvider';
import { TrackPage } from '../providers/TrackingProvider';
import { PageName } from '../types/Events';
import ProjectSettings from './ProjectSettings';
import { CardContainer, ContentWrapper } from './Settings.styles';

const Settings: FC = () => {
    const {
        health: {
            data: health,
            isLoading: isHealthLoading,
            error: healthError,
        },
        user: { data: user, isLoading: isUserLoading, error: userError },
    } = useApp();
    const {
        data: organization,
        isLoading: isOrganizationLoading,
        error: organizationError,
    } = useOrganization();

    if (isHealthLoading || isUserLoading || isOrganizationLoading) {
        return <PageSpinner />;
    }

    if (userError || healthError || organizationError) {
        return (
            <ErrorState
                error={
                    userError?.error ||
                    healthError?.error ||
                    organizationError?.error
                }
            />
        );
    }

    if (!health || !user || !organization) return null;

    const basePath = `/generalSettings`;

    const allowPasswordAuthentication =
        !health.auth.disablePasswordAuthentication;

    const hasSocialLogin =
        health.auth.google.oauth2ClientId ||
        health.auth.okta.enabled ||
        health.auth.oneLogin.enabled;

    return (
        <PageWithSidebar alignItems="flex-start">
            <Helmet>
                <title>Settings - Lightdash</title>
            </Helmet>

            <Sidebar title="Settings">
                <NavLink label="Your settings" defaultOpened>
                    <NavLink
                        component={RouterNavLink}
                        exact
                        to={basePath}
                        label="Profile"
                        icon={<MantineIcon icon={IconUserCircle} />}
                    />

                    {allowPasswordAuthentication && (
                        <NavLink
                            component={RouterNavLink}
                            label={
                                hasSocialLogin
                                    ? 'Password & Social Logins'
                                    : 'Password'
                            }
                            exact
                            to={`${basePath}/password`}
                            icon={<MantineIcon icon={IconLock} />}
                        />
                    )}

                    <NavLink
                        component={RouterNavLink}
                        label="Personal access tokens"
                        exact
                        to={`${basePath}/personalAccessTokens`}
                        icon={<MantineIcon icon={IconKey} />}
                    />
                </NavLink>

                <Can
                    I="create"
                    this={subject('Project', {
                        organizationUuid: organization.organizationUuid,
                    })}
                >
                    <NavLink label="Organization settings" defaultOpened>
                        {user.ability.can('manage', 'Organization') && (
                            <NavLink
                                component={RouterNavLink}
                                label="General"
                                exact
                                to={`${basePath}/organization`}
                                icon={<MantineIcon icon={IconUserCircle} />}
                            />
                        )}

                        {user.ability.can(
                            'view',
                            'OrganizationMemberProfile',
                        ) && (
                            <NavLink
                                component={RouterNavLink}
                                label="User management"
                                to={`${basePath}/userManagement`}
                                icon={<MantineIcon icon={IconUserPlus} />}
                            />
                        )}

                        {organization &&
                            !organization.needsProject &&
                            user.ability.can('view', 'Project') && (
                                <NavLink
                                    component={RouterNavLink}
                                    label="Projects"
                                    to={`${basePath}/projectManagement`}
                                    icon={<MantineIcon icon={IconDatabase} />}
                                />
                            )}

                        <NavLink
                            component={RouterNavLink}
                            label="Appearance"
                            exact
                            to={`${basePath}/appearance`}
                            icon={<MantineIcon icon={IconPalette} />}
                        />

                        {health.hasSlack &&
                            user.ability.can('manage', 'Organization') && (
                                <NavLink
                                    component={RouterNavLink}
                                    label="Integrations"
                                    exact
                                    to={`${basePath}/integrations/slack`}
                                    icon={<MantineIcon icon={IconPlug} />}
                                />
                            )}
                    </NavLink>
                </Can>
            </Sidebar>

            <Switch>
                {allowPasswordAuthentication && (
                    <Route exact path={`/generalSettings/password`}>
                        <Content>
                            <CardContainer>
                                <Title order={4}>Password settings</Title>
                                <PasswordPanel />
                            </CardContainer>
                            {hasSocialLogin && (
                                <CardContainer>
                                    <Title order={4}>Social logins</Title>
                                    <SocialLoginsPanel />
                                </CardContainer>
                            )}
                        </Content>
                    </Route>
                )}

                {user.ability.can('manage', 'Organization') && (
                    <Route exact path={`/generalSettings/organization`}>
                        <Content>
                            <CardContainer>
                                <Title order={4}>General</Title>
                                <OrganizationPanel />
                            </CardContainer>
                            <CardContainer>
                                <div>
                                    <Title order={4}>
                                        Allowed email domains
                                    </Title>
                                    <Description>
                                        Anyone with email addresses at these
                                        domains can automatically join the
                                        organization.
                                    </Description>
                                </div>
                                <AllowedDomainsPanel />
                            </CardContainer>
                            <DeleteOrganizationPanel />
                        </Content>
                    </Route>
                )}

                {user.ability.can('view', 'OrganizationMemberProfile') && (
                    <Route path={`/generalSettings/userManagement`}>
                        <Content>
                            <ContentWrapper>
                                <UserManagementPanel />
                            </ContentWrapper>
                        </Content>
                    </Route>
                )}

                {organization &&
                    !organization.needsProject &&
                    user.ability.can('view', 'Project') && (
                        <Route
                            exact
                            path={`/generalSettings/projectManagement`}
                        >
                            <Content>
                                <ContentWrapper>
                                    <ProjectManagementPanel />
                                </ContentWrapper>
                            </Content>
                        </Route>
                    )}

                {organization &&
                    !organization.needsProject &&
                    user.ability.can('view', 'Project') && (
                        <Route
                            exact
                            path={[
                                '/generalSettings/projectManagement/:projectUuid/:tab?',
                                '/generalSettings/projectManagement/:projectUuid/integrations/:tab',
                            ]}
                        >
                            <TrackPage name={PageName.PROJECT_SETTINGS}>
                                <Content>
                                    <ContentWrapper>
                                        <ProjectSettings />
                                    </ContentWrapper>
                                </Content>
                            </TrackPage>
                        </Route>
                    )}

                <Route exact path={`/generalSettings/appearance`}>
                    <Content>
                        <CardContainer>
                            <Title order={4}>Appearance settings</Title>
                            <AppearancePanel />
                        </CardContainer>
                    </Content>
                </Route>

                <Route exact path={`/generalSettings/personalAccessTokens`}>
                    <Content>
                        <ContentWrapper>
                            <AccessTokensPanel />
                        </ContentWrapper>
                    </Content>
                </Route>
                {health.hasSlack && user.ability.can('manage', 'Organization') && (
                    <Route exact path={`/generalSettings/integrations/slack`}>
                        <Content>
                            <CardContainer>
                                <SlackSettingsPanel />
                            </CardContainer>
                        </Content>
                    </Route>
                )}
                <Route exact path={`/generalSettings`}>
                    <Content>
                        <CardContainer>
                            <Title order={4}>Profile settings</Title>
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
