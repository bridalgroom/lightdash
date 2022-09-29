import { formatDate, TimeFrames, WarehouseTypes } from '@lightdash/common';
import moment from 'moment';
import { FC, useEffect } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import Page from '../components/common/Page/Page';
import PageSpinner from '../components/PageSpinner';
import ConnectManually from '../components/ProjectConnection/ProjectConnectFlow/ConnectManually';
import ConnectSuccess from '../components/ProjectConnection/ProjectConnectFlow/ConnectSuccess';
import ConnectUsingCLI from '../components/ProjectConnection/ProjectConnectFlow/ConnectUsingCLI';
import { ProjectFormProvider } from '../components/ProjectConnection/ProjectFormProvider';
import { useOrganisation } from '../hooks/organisation/useOrganisation';
import { useCreateAccessToken } from '../hooks/useAccessToken';
import useSearchParams from '../hooks/useSearchParams';
import { useApp } from '../providers/AppProvider';

export type SelectedWarehouse = {
    label: string;
    key: WarehouseTypes;
    icon: string;
};

enum ConnectMethod {
    CLI = 'cli',
    MANUAL = 'manual',
}

const CreateProject: FC = () => {
    const { isLoading: isLoadingOrganisation, data: organisation } =
        useOrganisation();

    const {
        health: { data: health, isLoading: isLoadingHealth },
    } = useApp();

    const {
        mutate: mutateAccessToken,
        data: tokenData,
        isLoading: isTokenCreating,
        isSuccess: isTokenCreated,
    } = useCreateAccessToken();

    const { method } = useParams<{ method: ConnectMethod }>();
    const projectUuid = useSearchParams('projectUuid');

    useEffect(() => {
        if (method !== ConnectMethod.CLI || isTokenCreated) return;

        const expiresAt = moment().add(30, 'days').toDate();
        const generatedAtString = formatDate(new Date(), TimeFrames.SECOND);

        mutateAccessToken({
            expiresAt,
            description: `Generated by the Lightdash UI during onboarding on ${generatedAtString}`,
        });
    }, [mutateAccessToken, method, isTokenCreated]);

    if (
        isLoadingHealth ||
        !health ||
        isLoadingOrganisation ||
        !organisation ||
        isTokenCreating
    ) {
        return <PageSpinner />;
    }

    if (method && projectUuid) {
        return <ConnectSuccess projectUuid={projectUuid} />;
    }

    return (
        <ProjectFormProvider>
            <Page noContentPadding>
                {method === ConnectMethod.CLI && (
                    <ConnectUsingCLI
                        isSSO={true}
                        loginToken={tokenData?.token}
                        siteUrl={health.siteUrl}
                        needsProject={!!organisation.needsProject}
                    />
                )}
                {method === ConnectMethod.MANUAL && (
                    <ConnectManually
                        needsProject={!!organisation.needsProject}
                    />
                )}

                {!method && (
                    <Redirect to={`/createProject/${ConnectMethod.CLI}`} />
                )}
            </Page>
        </ProjectFormProvider>
    );
};

export default CreateProject;
