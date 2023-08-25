import { Classes, Divider, Menu } from '@blueprintjs/core';
import { MenuItem2, Popover2 } from '@blueprintjs/popover2';
import { Dashboard, SpaceSummary, UpdatedByUser } from '@lightdash/common';
import {
    ActionIcon,
    Box,
    Button,
    Flex,
    Popover,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    IconCheck,
    IconCopy,
    IconDots,
    IconFolders,
    IconInfoCircle,
    IconPencil,
    IconPlus,
    IconRefresh,
    IconSend,
    IconTrash,
    IconUpload,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useToggle } from 'react-use';
import { useDashboardRefresh } from '../../../hooks/dashboard/useDashboardRefresh';
import { useApp } from '../../../providers/AppProvider';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import AddTileButton from '../../DashboardTiles/AddTileButton';
import DashboardSchedulersModal from '../../SchedulerModals/DashboardSchedulersModal';
import { getSchedulerUuidFromUrlParams } from '../../SchedulerModals/SchedulerModalBase/SchedulerModalContent';
import ShareLinkButton from '../../ShareLinkButton';
import MantineIcon from '../MantineIcon';
import DashboardUpdateModal from '../modal/DashboardUpdateModal';
import PageHeader from '../Page/PageHeader';
import {
    PageActionsContainer,
    PageTitle,
    PageTitleAndDetailsContainer,
    PageTitleContainer,
} from '../PageHeader';
import SpaceAndDashboardInfo from '../PageHeader/SpaceAndDashboardInfo';
import { UpdatedInfo } from '../PageHeader/UpdatedInfo';
import ViewInfo from '../PageHeader/ViewInfo';
import SpaceActionModal, { ActionType } from '../SpaceActionModal';

type DashboardHeaderProps = {
    spaces?: SpaceSummary[];
    dashboardDescription?: string;
    dashboardName: string;
    dashboardSpaceName?: string;
    dashboardSpaceUuid?: string;
    dashboardUpdatedAt: Date;
    dashboardViews: number;
    dashboardFirstViewedAt: Date | string | null;
    dashboardUpdatedByUser?: UpdatedByUser;
    hasDashboardChanged: boolean;
    isEditMode: boolean;
    isSaving: boolean;
    onAddTiles: (tiles: Dashboard['tiles'][number][]) => void;
    onCancel: () => void;
    onSaveDashboard: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveToSpace: (spaceUuid: string) => void;
    onExport: () => void;
};

const DashboardHeader = ({
    spaces = [],
    dashboardDescription,
    dashboardName,
    dashboardSpaceName,
    dashboardSpaceUuid,
    dashboardViews,
    dashboardFirstViewedAt,
    dashboardUpdatedAt,
    dashboardUpdatedByUser,
    hasDashboardChanged,
    isEditMode,
    isSaving,
    onAddTiles,
    onCancel,
    onSaveDashboard,
    onDelete,
    onDuplicate,
    onMoveToSpace,
    onExport,
}: DashboardHeaderProps) => {
    const { search } = useLocation();
    const { projectUuid, dashboardUuid } = useParams<{
        projectUuid: string;
        dashboardUuid: string;
    }>();
    const { isOneAtLeastFetching, invalidateDashboardRelatedQueries } =
        useDashboardRefresh(dashboardUuid);
    const history = useHistory();
    const { track } = useTracking();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCreatingNewSpace, setIsCreatingNewSpace] = useState(false);
    const [isScheduledDeliveriesModalOpen, toggleSchedulerDeliveriesModel] =
        useToggle(false);
    const handleEditClick = () => {
        setIsUpdating(true);
        track({ name: EventName.UPDATE_DASHBOARD_NAME_CLICKED });
    };

    useEffect(() => {
        const schedulerUuidFromUrlParams =
            getSchedulerUuidFromUrlParams(search);
        if (schedulerUuidFromUrlParams) {
            toggleSchedulerDeliveriesModel(true);
        }
    }, [search, toggleSchedulerDeliveriesModel]);

    const { user } = useApp();
    const userCanManageDashboard = user.data?.ability.can(
        'manage',
        'Dashboard',
    );

    return (
        <PageHeader h="auto">
            <PageTitleAndDetailsContainer>
                <PageTitleContainer className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
                    <PageTitle>{dashboardName}</PageTitle>

                    <Popover
                        withinPortal
                        withArrow
                        offset={{
                            mainAxis: -2,
                            crossAxis: 6,
                        }}
                    >
                        <Popover.Target>
                            <ActionIcon color="dark">
                                <MantineIcon icon={IconInfoCircle} />
                            </ActionIcon>
                        </Popover.Target>

                        <Popover.Dropdown>
                            <Stack spacing="xs">
                                {dashboardDescription && (
                                    <Text fz="xs" color="gray.7" fw={500}>
                                        {dashboardDescription}
                                    </Text>
                                )}
                                <Flex align="center" gap="xxs">
                                    <MantineIcon
                                        icon={IconPencil}
                                        color="gray.6"
                                    />
                                    <UpdatedInfo
                                        updatedAt={dashboardUpdatedAt}
                                        user={dashboardUpdatedByUser}
                                    />
                                </Flex>

                                <ViewInfo
                                    views={dashboardViews}
                                    firstViewedAt={dashboardFirstViewedAt}
                                />

                                {dashboardSpaceName && (
                                    <SpaceAndDashboardInfo
                                        space={{
                                            link: `/projects/${projectUuid}/spaces/${dashboardSpaceUuid}`,
                                            name: dashboardSpaceName,
                                        }}
                                    />
                                )}
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>

                    {isEditMode && userCanManageDashboard && (
                        <ActionIcon
                            color="dark"
                            disabled={isSaving}
                            onClick={handleEditClick}
                        >
                            <MantineIcon icon={IconPencil} />
                        </ActionIcon>
                    )}

                    {isUpdating && (
                        <DashboardUpdateModal
                            uuid={dashboardUuid}
                            isOpen={isUpdating}
                            onClose={() => setIsUpdating(false)}
                            onConfirm={() => setIsUpdating(false)}
                        />
                    )}
                </PageTitleContainer>
            </PageTitleAndDetailsContainer>
            {userCanManageDashboard && isEditMode ? (
                <PageActionsContainer>
                    <AddTileButton
                        onAddTiles={onAddTiles}
                        disabled={isSaving}
                    />
                    <Tooltip
                        fz="xs"
                        withinPortal
                        position="bottom"
                        label="No changes to save"
                        disabled={hasDashboardChanged}
                    >
                        <Box>
                            <Button
                                size="xs"
                                disabled={!hasDashboardChanged}
                                loading={isSaving}
                                onClick={onSaveDashboard}
                            >
                                Save
                            </Button>
                        </Box>
                    </Tooltip>
                    <Button
                        variant="default"
                        size="xs"
                        disabled={isSaving}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </PageActionsContainer>
            ) : userCanManageDashboard ? (
                <PageActionsContainer>
                    <Button
                        size="xs"
                        disabled={isEditMode}
                        loading={isOneAtLeastFetching}
                        leftIcon={<MantineIcon icon={IconRefresh} />}
                        onClick={invalidateDashboardRelatedQueries}
                    >
                        Refresh
                    </Button>
                    <Button
                        size="xs"
                        variant="default"
                        leftIcon={<MantineIcon icon={IconPencil} />}
                        onClick={() => {
                            history.replace(
                                `/projects/${projectUuid}/dashboards/${dashboardUuid}/edit`,
                            );
                        }}
                    >
                        Edit dashboard
                    </Button>

                    <ShareLinkButton url={`${window.location.href}`} />

                    <Popover2
                        placement="bottom"
                        content={
                            <Menu>
                                <MenuItem2
                                    icon={<IconCopy />}
                                    text="Duplicate"
                                    onClick={onDuplicate}
                                />

                                <MenuItem2
                                    icon={<IconFolders />}
                                    text="Move to space"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    {spaces?.map((spaceToMove) => {
                                        const isDisabled =
                                            dashboardSpaceUuid ===
                                            spaceToMove.uuid;
                                        return (
                                            <MenuItem2
                                                key={spaceToMove.uuid}
                                                text={spaceToMove.name}
                                                icon={
                                                    isDisabled ? (
                                                        <IconCheck />
                                                    ) : undefined
                                                }
                                                className={
                                                    isDisabled
                                                        ? 'bp4-disabled'
                                                        : ''
                                                }
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (
                                                        dashboardSpaceUuid !==
                                                        spaceToMove.uuid
                                                    ) {
                                                        onMoveToSpace(
                                                            spaceToMove.uuid,
                                                        );
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                    <Divider />
                                    <MenuItem2
                                        icon={<IconPlus />}
                                        text="Create new"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsCreatingNewSpace(true);
                                        }}
                                    />
                                </MenuItem2>
                                <MenuItem2
                                    icon={<IconSend />}
                                    text="Scheduled deliveries"
                                    onClick={() => {
                                        toggleSchedulerDeliveriesModel(true);
                                    }}
                                />
                                <MenuItem2
                                    icon={<IconUpload />}
                                    text="Export dashboard"
                                    onClick={onExport}
                                />
                                <Divider />
                                <MenuItem2
                                    icon={<IconTrash />}
                                    text="Delete"
                                    intent="danger"
                                    onClick={onDelete}
                                />
                            </Menu>
                        }
                    >
                        <ActionIcon variant="default">
                            <MantineIcon icon={IconDots} />
                        </ActionIcon>
                    </Popover2>

                    {isCreatingNewSpace && (
                        <SpaceActionModal
                            projectUuid={projectUuid}
                            actionType={ActionType.CREATE}
                            title="Create new space"
                            confirmButtonLabel="Create"
                            icon="folder-close"
                            onClose={() => setIsCreatingNewSpace(false)}
                            onSubmitForm={(space) => {
                                if (space) onMoveToSpace(space.uuid);
                            }}
                        />
                    )}
                    {isScheduledDeliveriesModalOpen && dashboardUuid && (
                        <DashboardSchedulersModal
                            dashboardUuid={dashboardUuid}
                            name={dashboardName}
                            isOpen={isScheduledDeliveriesModalOpen}
                            onClose={() =>
                                toggleSchedulerDeliveriesModel(false)
                            }
                        />
                    )}
                </PageActionsContainer>
            ) : null}
        </PageHeader>
    );
};

export default DashboardHeader;
