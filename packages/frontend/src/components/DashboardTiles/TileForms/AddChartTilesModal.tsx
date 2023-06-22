import {
    Dashboard,
    DashboardTileTypes,
    defaultTileSize,
} from '@lightdash/common';
import {
    Button,
    Group,
    Modal,
    MultiSelect,
    Stack,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { uuid4 } from '@sentry/utils';
import { IconChartAreaLine } from '@tabler/icons-react';
import React, { FC, forwardRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useChartSummaries } from '../../../hooks/useChartSummaries';
import { useDashboardContext } from '../../../providers/DashboardProvider';
import MantineIcon from '../../common/MantineIcon';

type Props = {
    onAddTiles: (tiles: Dashboard['tiles'][number][]) => void;
    onClose: () => void;
};

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
    label: string;
    description?: string;
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
    ({ label, description, ...others }: ItemProps, ref) => (
        <div ref={ref} {...others}>
            <Stack spacing="two">
                {description ? (
                    <Tooltip label={description} position="top-start">
                        <Text>{label}</Text>
                    </Tooltip>
                ) : (
                    <Text>{label}</Text>
                )}
            </Stack>
        </div>
    ),
);

const AddChartTilesModal: FC<Props> = ({ onAddTiles, onClose }) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { data: savedCharts, isLoading } = useChartSummaries(projectUuid);
    const { dashboardTiles, dashboard } = useDashboardContext();
    const form = useForm({
        initialValues: {
            savedChartsUuids: [],
        },
    });
    const allSavedCharts = useMemo(() => {
        const reorderedCharts = savedCharts?.sort((chartA, chartB) =>
            chartA.spaceUuid === dashboard?.spaceUuid
                ? -1
                : chartB.spaceUuid === dashboard?.spaceUuid
                ? 1
                : 0,
        );
        return (reorderedCharts || []).map(({ uuid, name, spaceName }) => {
            const alreadyAddedChart = dashboardTiles.find((tile) => {
                return (
                    tile.type === DashboardTileTypes.SAVED_CHART &&
                    tile.properties.savedChartUuid === uuid
                );
            });

            return {
                value: uuid,
                label: name,
                group: spaceName,
                disabled: alreadyAddedChart !== undefined,
                description: alreadyAddedChart
                    ? 'This chart has been already added to this dashboard'
                    : undefined,
            };
        });
    }, [dashboardTiles, savedCharts, dashboard?.spaceUuid]);

    const handleSubmit = form.onSubmit(({ savedChartsUuids }) => {
        onAddTiles(
            savedChartsUuids.map((uuid) => {
                const savedChart = savedCharts?.find((chart) => {
                    return chart.uuid === uuid;
                });
                return {
                    uuid: uuid4(),
                    properties: {
                        title: savedChart?.name || null,
                        savedChartUuid: uuid,
                    },
                    type: DashboardTileTypes.SAVED_CHART,
                    ...defaultTileSize,
                };
            }),
        );
        onClose();
    });

    const dashboardTitleName = dashboard?.name
        ? `"${dashboard.name}"`
        : 'dashboard';

    if (!savedCharts || !dashboardTiles || isLoading) return null;

    return (
        <Modal
            opened={true}
            onClose={onClose}
            title={
                <Group spacing="xs">
                    <MantineIcon
                        icon={IconChartAreaLine}
                        size="lg"
                        color="blue.8"
                    />
                    <Title order={4}>
                        Add saved charts to {dashboardTitleName}
                    </Title>
                </Group>
            }
            centered
            withCloseButton
        >
            <Stack spacing="md">
                <form
                    id="add-saved-charts-to-dashboard"
                    onSubmit={handleSubmit}
                >
                    <MultiSelect
                        id="saved-charts"
                        label={`Select the charts you want to add to this dashboard`}
                        data={allSavedCharts}
                        disabled={isLoading}
                        defaultValue={[]}
                        required
                        withinPortal
                        itemComponent={SelectItem}
                        {...form.getInputProps('savedChartsUuids')}
                    />
                    <Group spacing="xs" position="right" mt="md">
                        <Button
                            onClick={() => {
                                if (onClose) onClose();
                            }}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            Add
                        </Button>
                    </Group>
                </form>
            </Stack>
        </Modal>
    );
};

export default AddChartTilesModal;
