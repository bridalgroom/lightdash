import { NonIdealState, Spinner } from '@blueprintjs/core';
import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { useUnmount } from 'react-use';
import Page from '../components/common/Page/Page';
import { PageContentWrapper } from '../components/common/Page/Page.styles';
import ForbiddenPanel from '../components/ForbiddenPanel';
import LandingPanel from '../components/Home/LandingPanel';
import OnboardingPanel from '../components/Home/OnboardingPanel/index';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { useProject } from '../hooks/useProject';
import { useApp } from '../providers/AppProvider';

const Home: FC = () => {
    const params = useParams<{ projectUuid: string }>();
    const selectedProjectUuid = params.projectUuid;
    const project = useProject(selectedProjectUuid);
    const onboarding = useOnboardingStatus();

    const { user } = useApp();

    const isLoading = onboarding.isLoading || project.isLoading;
    const error = onboarding.error || project.error;

    useUnmount(() => onboarding.remove());

    if (user.data?.ability?.cannot('view', 'SavedChart')) {
        return <ForbiddenPanel />;
    }

    if (isLoading) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState title="Loading..." icon={<Spinner />} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState
                    title="Unexpected error"
                    description={error.error.message}
                />
            </div>
        );
    }

    if (!project.data || !onboarding.data) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState
                    title="Unexpected error"
                    description="Please contact support"
                />
            </div>
        );
    }

    return (
        <Page>
            <PageContentWrapper>
                {!onboarding.data.ranQuery ? (
                    <OnboardingPanel
                        projectUuid={project.data.projectUuid}
                        userName={user.data?.firstName}
                    />
                ) : (
                    <LandingPanel
                        userName={user.data?.firstName}
                        projectUuid={project.data.projectUuid}
                    />
                )}
            </PageContentWrapper>
        </Page>
    );
};

export default Home;
