import {
    DashboardTileTypes,
    getDefaultChartTileSize,
    type CreateSavedChartVersion,
    type DashboardBasicDetails,
    type DashboardChartTile,
    type SavedChart,
    type SpaceSummary,
} from '@lightdash/common';
import {
    Box,
    Button,
    Group,
    Loader,
    LoadingOverlay,
    Radio,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { useForm, type UseFormReturnType } from '@mantine/form';
import { uuid4 } from '@sentry/utils';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import { useParams } from 'react-router-dom';
import {
    appendNewTilesToBottom,
    useDashboardQuery,
    useUpdateDashboard,
} from '../../../../hooks/dashboard/useDashboard';
import { useDashboards } from '../../../../hooks/dashboard/useDashboards';
import { useCreateMutation } from '../../../../hooks/useSavedQuery';
import {
    useCreateMutation as useSpaceCreateMutation,
    useSpaceSummaries,
} from '../../../../hooks/useSpaces';
import MantineIcon from '../../MantineIcon';

type ChartCreateModalFormValues = {
    name: string;
    spaceUuid: string;
    dashboardUuid: string;
    dashboardName: string;
    description: string;
    newSpaceName: string | null;
    saveDestination: SaveDestination;
};

enum SaveDestination {
    Dashboard = 'dashboard',
    Space = 'space',
}

type SaveToSpaceProps = {
    form: UseFormReturnType<ChartCreateModalFormValues>;
    spaces: SpaceSummary[] | undefined;
};

const SaveToSpace: FC<SaveToSpaceProps> = ({ form, spaces }) => {
    const [shouldCreateNewSpace, setShouldCreateNewSpace] = useState(false);
    const isCreatingNewSpace =
        shouldCreateNewSpace || !spaces || spaces.length === 0;

    if (isCreatingNewSpace) {
        return (
            <Stack spacing="xs">
                <TextInput
                    size="xs"
                    label="Space"
                    description="Create a new space to add this chart to"
                    placeholder="eg. KPIs"
                    {...form.getInputProps('newSpaceName')}
                />
                <Button
                    size="xs"
                    variant="default"
                    mr="auto"
                    compact
                    onClick={() => {
                        setShouldCreateNewSpace(false);
                        form.setFieldValue('newSpaceName', null);
                    }}
                    leftIcon={<MantineIcon icon={IconArrowLeft} />}
                >
                    Save to existing space
                </Button>
            </Stack>
        );
    }

    return (
        <Stack spacing="xs">
            <Select
                size="xs"
                searchable
                label="Space"
                description="Select a space to save the chart directly to"
                withinPortal
                data={spaces.map((space) => ({
                    value: space.uuid,
                    label: space.name,
                }))}
                {...form.getInputProps('spaceUuid')}
                required={form.values.saveDestination === SaveDestination.Space}
            />
            <Button
                size="xs"
                variant="default"
                mr="auto"
                compact
                leftIcon={<MantineIcon icon={IconPlus} />}
                onClick={() => setShouldCreateNewSpace(true)}
            >
                Create new space
            </Button>
        </Stack>
    );
};

type SaveToDashboardProps = Pick<SaveToSpaceProps, 'form' | 'spaces'> & {
    dashboards: DashboardBasicDetails[] | undefined;
    isLoadingDashboards: boolean;
};

const SaveToDashboard: FC<SaveToDashboardProps> = ({
    form,
    spaces,
    dashboards,
    isLoadingDashboards,
}) => {
    if (!dashboards) return null;

    return (
        <Select
            description="Select a dashboard to save the chart directly to"
            id="select-dashboard"
            label="Dashboard"
            size="xs"
            data={dashboards.map((d) => ({
                value: d.uuid,
                label: d.name,
                group: (spaces ?? []).find((s) => s.uuid === d.spaceUuid)?.name,
            }))}
            rightSection={isLoadingDashboards && <Loader size="xs" />}
            defaultValue={
                dashboards.find((d) => d.spaceUuid === form.values.spaceUuid)
                    ?.uuid
            }
            searchable
            nothingFound="No matching dashboards found"
            filter={(value, dashboard) =>
                !!dashboard.label
                    ?.toLowerCase()
                    .includes(value.toLowerCase().trim())
            }
            withinPortal
            required={form.values.saveDestination === SaveDestination.Dashboard}
            {...form.getInputProps('dashboardUuid')}
        />
    );
};

type SaveToSpaceOrDashboardProps = {
    savedData: CreateSavedChartVersion;
    defaultSpaceUuid: string | undefined;
    dashboardInfoFromSavedData: {
        dashboardUuid: string | null;
        dashboardName: string | null;
    };
    onConfirm: (savedData: CreateSavedChartVersion) => void;
    onClose: () => void;
};

export const SaveToSpaceOrDashboard: FC<SaveToSpaceOrDashboardProps> = ({
    savedData,
    defaultSpaceUuid,
    dashboardInfoFromSavedData,
    onConfirm,
    onClose,
}) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();

    const { mutateAsync: createChart } = useCreateMutation();

    const [, setShouldCreateNewSpace] = useState(false);
    const { mutateAsync: createSpace } = useSpaceCreateMutation(projectUuid);

    const form = useForm<ChartCreateModalFormValues>({
        initialValues: {
            name: '',
            spaceUuid: '',
            dashboardUuid: '',
            dashboardName: '',
            description: '',
            newSpaceName: null,
            saveDestination: SaveDestination.Space,
        },

        validate: {
            name: (value) => (value.length > 0 ? null : 'Name is required'),
        },
    });

    const { data: dashboards, isInitialLoading: isLoadingDashboards } =
        useDashboards(
            projectUuid,
            {
                staleTime: 0,
                onSuccess: () => {
                    console.log(
                        'dashboardInfoFromSavedData',
                        dashboardInfoFromSavedData,
                    );
                    if (
                        dashboardInfoFromSavedData.dashboardUuid &&
                        dashboardInfoFromSavedData.dashboardName
                    ) {
                        form.setFieldValue(
                            'dashboardUuid',
                            dashboardInfoFromSavedData.dashboardUuid,
                        );
                        form.setFieldValue(
                            'dashboardName',
                            dashboardInfoFromSavedData.dashboardName,
                        );
                    }
                },
            },
            true, // includePrivateSpaces // TODO: check if this is needed
        );

    const { data: spaces, isInitialLoading: isLoadingSpaces } =
        useSpaceSummaries(projectUuid, true, {
            staleTime: 0,
            onSuccess: (data) => {
                if (data.length > 0) {
                    const currentSpace = defaultSpaceUuid
                        ? data.find((space) => space.uuid === defaultSpaceUuid)
                        : data[0];
                    form.setFieldValue('spaceUuid', currentSpace?.uuid || '');
                } else {
                    setShouldCreateNewSpace(true);
                }
            },
        });

    const { mutateAsync: updateDashboard } = useUpdateDashboard(
        form.values.dashboardUuid,
    );
    const { data: selectedDashboard } = useDashboardQuery(
        form.values.dashboardUuid,
    );

    const handleOnSubmit = useCallback(
        async (values: ChartCreateModalFormValues) => {
            let savedQuery: SavedChart | undefined;
            if (values.saveDestination === SaveDestination.Dashboard) {
                if (!selectedDashboard) {
                    throw new Error('Expected dashboard');
                }
                savedQuery = await createChart({
                    ...savedData,
                    name: values.name,
                    description: values.description,
                    dashboardUuid: values.dashboardUuid,
                });
                const newTile: DashboardChartTile = {
                    uuid: uuid4(),
                    type: DashboardTileTypes.SAVED_CHART,
                    properties: {
                        belongsToDashboard: true,
                        savedChartUuid: savedQuery.uuid,
                        chartName: values.name,
                    },
                    ...getDefaultChartTileSize(savedData.chartConfig?.type),
                };
                await updateDashboard({
                    name: values.dashboardName,
                    filters: selectedDashboard.filters,
                    tiles: appendNewTilesToBottom(selectedDashboard.tiles, [
                        newTile,
                    ]),
                });
            }

            if (values.saveDestination === SaveDestination.Space) {
                let newSpace = values.newSpaceName
                    ? await createSpace({
                          name: values.newSpaceName,
                          access: [],
                          isPrivate: true,
                      })
                    : undefined;
                const spaceUuid = newSpace?.uuid || values.spaceUuid;

                savedQuery = await createChart({
                    ...savedData,
                    name: values.name,
                    description: values.description,
                    spaceUuid,
                    dashboardUuid: undefined,
                });
            }

            if (savedQuery) {
                setShouldCreateNewSpace(false);
                onConfirm(savedQuery);
                return savedQuery;
            }
        },
        [
            createSpace,
            selectedDashboard,
            createChart,
            savedData,
            updateDashboard,
            onConfirm,
        ],
    );

    return (
        <form
            onSubmit={form.onSubmit((values) => {
                handleOnSubmit(values);
            })}
        >
            <LoadingOverlay visible={isLoadingSpaces} />
            <Box p="md">
                <Stack spacing="xs">
                    <TextInput
                        label="Enter a memorable name for your chart"
                        placeholder="eg. How many weekly active users do we have?"
                        required
                        {...form.getInputProps('name')}
                        data-testid="ChartCreateModal/NameInput"
                    />
                    <Textarea
                        label="Chart description"
                        placeholder="A few words to give your team some context"
                        autosize
                        maxRows={3}
                        {...form.getInputProps('description')}
                    />
                </Stack>

                <Stack spacing="sm" mt="sm">
                    <Radio.Group
                        size="xs"
                        value={form.values.saveDestination}
                        {...form.getInputProps('saveDestination')}
                    >
                        <Group spacing="xs" mb="xs">
                            <Text fw={500}>Save to</Text>

                            <Radio
                                value={SaveDestination.Space}
                                label="Space"
                                styles={(theme) => ({
                                    label: {
                                        paddingLeft: theme.spacing.xs,
                                    },
                                })}
                                disabled={!spaces || isLoadingSpaces}
                            />
                            <Radio
                                value={SaveDestination.Dashboard}
                                label="Dashboard"
                                styles={(theme) => ({
                                    label: {
                                        paddingLeft: theme.spacing.xs,
                                    },
                                })}
                            />
                        </Group>
                        {form.values.saveDestination ===
                            SaveDestination.Space && (
                            <SaveToSpace form={form} spaces={spaces} />
                        )}
                        {form.values.saveDestination ===
                            SaveDestination.Dashboard && (
                            <SaveToDashboard
                                form={form}
                                spaces={spaces}
                                dashboards={dashboards}
                                isLoadingDashboards={isLoadingDashboards}
                            />
                        )}
                    </Radio.Group>
                </Stack>
            </Box>
            <Group
                position="right"
                w="100%"
                sx={(theme) => ({
                    borderTop: `1px solid ${theme.colors.gray[4]}`,
                    bottom: 0,
                    padding: theme.spacing.md,
                })}
            >
                <Button onClick={onClose} variant="outline">
                    Cancel
                </Button>

                <Button
                    type="submit"
                    disabled={
                        !form.values.name ||
                        (!form.values.newSpaceName &&
                            form.values.saveDestination ===
                                SaveDestination.Space &&
                            !form.values.spaceUuid) ||
                        (!form.values.dashboardUuid &&
                            form.values.saveDestination ===
                                SaveDestination.Dashboard)
                    }
                >
                    Save
                </Button>
            </Group>
        </form>
    );
};
