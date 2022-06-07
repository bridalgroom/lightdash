import { Icon, Intent, RadioGroup } from '@blueprintjs/core';
import { WarehouseTypes } from '@lightdash/common';
import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import Page from '../components/common/Page/Page';
import PageSpinner from '../components/PageSpinner';
import { CreateProjectConnection } from '../components/ProjectConnection';
import WareHouseConnectCard from '../components/ProjectConnection/ProjectConnectFlow/WareHouseConnectCard.tsx';
import { ProjectFormProvider } from '../components/ProjectConnection/ProjectFormProvider';
import Form from '../components/ReactHookForm/Form';
// import RadioGroup from '../components/ReactHookForm/RadioGroup';
import { useApp } from '../providers/AppProvider';
import {
    BackToWarehouseButton,
    CreateHeaderWrapper,
    CreateProjectWrapper,
    Title,
} from './CreateProject.styles';

export type SelectedWarehouse = {
    label: string;
    key: WarehouseTypes;
    icon: string;
};

const CreateProject: FC = () => {
    const { health } = useApp();
    const [selectedWarehouse, setSelectedWarehouse] = useState<
        SelectedWarehouse | undefined
    >();
    const [hasDimensions, setHasDimensions] = useState<
        'yes' | 'no' | undefined
    >();

    if (health.isLoading) {
        return <PageSpinner />;
    }
    console.log(hasDimensions);

    const PanelToRender = () => {
        switch (hasDimensions) {
            case 'yes':
                return (
                    <>
                        {!selectedWarehouse ? (
                            <WareHouseConnectCard
                                setWarehouse={setSelectedWarehouse}
                            />
                        ) : (
                            <CreateProjectWrapper>
                                <CreateHeaderWrapper>
                                    <BackToWarehouseButton
                                        icon="chevron-left"
                                        text="Back"
                                        onClick={() =>
                                            setSelectedWarehouse(undefined)
                                        }
                                    />
                                    <Title marginBottom>
                                        {`Create a ${selectedWarehouse.label} connection`}
                                    </Title>
                                </CreateHeaderWrapper>
                                <CreateProjectConnection
                                    selectedWarehouse={selectedWarehouse}
                                />
                            </CreateProjectWrapper>
                        )}
                    </>
                );
            case 'no':
                return (
                    <ConnectionOptions setHasDimensions={setHasDimensions} />
                );
            case undefined:
                return (
                    <HowToConnectDataCard setHasDimensions={setHasDimensions} />
                );
            default:
                return <></>;
        }
    };

    return (
        <Page
            hideFooter={!!selectedWarehouse}
            noContentPadding={!!selectedWarehouse}
        >
            <ProjectFormProvider>
                {!selectedWarehouse ? (
                    <WareHouseConnectCard
                        setWarehouse={setSelectedWarehouse}
                        showDemoLink
                    />
                ) : (
                    <CreateProjectWrapper>
                        <CreateHeaderWrapper>
                            <BackToWarehouseButton
                                icon="chevron-left"
                                text="Back"
                                onClick={() => setSelectedWarehouse(undefined)}
                            />
                            <Title marginBottom>
                                {`Create a ${selectedWarehouse.label} connection`}
                            </Title>
                        </CreateHeaderWrapper>
                        <CreateProjectConnection
                            selectedWarehouse={selectedWarehouse}
                        />
                    </CreateProjectWrapper>
                )}
            </ProjectFormProvider>
        </Page>
    );
};

export default CreateProject;
