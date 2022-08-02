import {
    Button,
    Classes,
    Dialog,
    Intent,
    NonIdealState,
} from '@blueprintjs/core';
import React, { FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Redirect, useParams } from 'react-router-dom';
import { useCreateMutation } from '../../../hooks/dashboard/useDashboard';
import {
    useDashboards,
    useUpdateMultipleDashboard,
} from '../../../hooks/dashboard/useDashboards';
import { useUpdateMultipleMutation } from '../../../hooks/useSavedQuery';
import { useSavedCharts, useSpace } from '../../../hooks/useSpaces';
import Form from '../../ReactHookForm/Form';
import MultiSelect from '../../ReactHookForm/MultiSelect';
import { DEFAULT_DASHBOARD_NAME } from '../../SpacePanel';
import { CreateNewText } from './AddToSpaceModal.style';

interface Props {
    isOpen: boolean;
    isChart?: boolean;
    onClose?: () => void;
}

type AddItemForm = {
    items: { value: string; label: string }[];
};

const AddToSpaceModal: FC<Props> = ({ isOpen, isChart, onClose }) => {
    const { projectUuid, spaceUuid } = useParams<{
        projectUuid: string;
        spaceUuid: string;
    }>();

    const { data: space } = useSpace(projectUuid, spaceUuid);

    const { mutate: chartMutation } = useUpdateMultipleMutation(projectUuid);
    const { mutate: dashboardMutation } =
        useUpdateMultipleDashboard(projectUuid);

    const methods = useForm<AddItemForm>({
        mode: 'onSubmit',
    });

    const { data: savedCharts, isLoading } = useSavedCharts(projectUuid);
    const { data: dashboards } = useDashboards(projectUuid);
    const {
        isLoading: isCreatingDashboard,
        isSuccess: hasCreatedDashboard,
        mutate: createDashboard,
        data: newDashboard,
    } = useCreateMutation(projectUuid);

    const closeModal = useCallback(() => {
        methods.reset();
        if (onClose) onClose();
    }, [methods, onClose]);
    const handleSubmit = useCallback(
        (formData: AddItemForm) => {
            if (isChart && savedCharts && formData.items) {
                const selectedCharts = formData.items.map((item) => {
                    const chart = savedCharts.find(
                        (savedChart) => savedChart.uuid === item.value,
                    );
                    return {
                        uuid: item.value,
                        name: chart?.name || '',
                        spaceUuid,
                    };
                });

                chartMutation(selectedCharts);
            }
            if (!isChart && dashboards && formData.items) {
                const selectedDashboards = formData.items.map((item) => {
                    const dashboard = dashboards.find(
                        (dash) => dash.uuid === item.value,
                    );
                    return {
                        uuid: item.value,
                        name: dashboard?.name || '',
                        spaceUuid,
                    };
                });
                dashboardMutation(selectedDashboards);
            }

            closeModal();
        },
        [
            chartMutation,
            savedCharts,
            isChart,
            spaceUuid,
            dashboardMutation,
            dashboards,
            closeModal,
        ],
    );
    const allItems = isChart === true ? savedCharts : dashboards;

    if (allItems === undefined) {
        return <NonIdealState title="No results available" icon="search" />;
    }
    const selectItems = allItems.map(
        ({ uuid: itemUuid, name, spaceUuid: itemSpaceUuid }) => {
            const alreadyAddedChart = spaceUuid === itemSpaceUuid;
            return {
                value: itemUuid,
                label: name,
                disabled: alreadyAddedChart,
            };
        },
    );
    if (hasCreatedDashboard && newDashboard) {
        return (
            <Redirect
                push
                to={`/projects/${projectUuid}/dashboards/${newDashboard.uuid}`}
            />
        );
    }
    return (
        <Dialog
            isOpen={isOpen}
            onClose={closeModal}
            lazy
            title={`Add ${isChart ? 'chart' : 'dashboard'} to space ${
                space?.name
            }`}
        >
            <Form
                name="add_items_to_space"
                methods={methods}
                onSubmit={handleSubmit}
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>
                        Select the {isChart ? 'charts' : 'dashboards'} you want
                        to move into this space {space?.name}
                    </p>

                    <MultiSelect
                        name="items"
                        rules={{
                            required: 'Required field',
                        }}
                        items={selectItems}
                        disabled={isLoading}
                        defaultValue={[]}
                    />
                    {!isChart && (
                        <CreateNewText
                            onClick={() => {
                                createDashboard({
                                    name: DEFAULT_DASHBOARD_NAME,
                                    tiles: [],
                                    spaceUuid,
                                });
                                closeModal();
                            }}
                        >
                            + Create new dashboard
                        </CreateNewText>
                    )}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={closeModal}>Cancel</Button>
                        <Button
                            intent={Intent.SUCCESS}
                            text={`Move ${isChart ? 'charts' : 'dashboards'}`}
                            disabled={isLoading}
                            type="submit"
                        />
                    </div>
                </div>
            </Form>
        </Dialog>
    );
};

export default AddToSpaceModal;
