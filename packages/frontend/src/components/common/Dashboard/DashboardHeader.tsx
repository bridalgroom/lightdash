import { Button, Classes, Intent } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { Dashboard, UpdatedByUser } from '@lightdash/common';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { useApp } from '../../../providers/AppProvider';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import AddTileButton from '../../DashboardTiles/AddTileButton';
import UpdateDashboardModal from '../../SavedDashboards/UpdateDashboardModal';
import ShareLinkButton from '../../ShareLinkButton';
import { UpdatedInfo } from '../ActionCard';
import {
    PageDetailsContainer,
    PageHeaderContainer,
    PageTitle,
    PageTitleAndDetailsContainer,
    PageTitleContainer,
    SeparatorDot,
} from '../PageHeader';

type DashboardHeaderProps = {
    isEditMode: boolean;
    onAddTiles: (tiles: Dashboard['tiles'][number][]) => void;
    onSaveDashboard: () => void;
    hasDashboardChanged: boolean;
    isSaving: boolean;
    dashboardName: string;
    dashboardDescription?: string;
    dashboardUpdatedByUser?: UpdatedByUser;
    dashboardUpdatedAt: Date;
    onSaveTitle: (title: string) => void;
    onCancel: () => void;
};

const DashboardHeader = ({
    isEditMode,
    onAddTiles,
    onSaveDashboard,
    hasDashboardChanged,
    isSaving,
    dashboardName,
    dashboardDescription,
    dashboardUpdatedByUser,
    dashboardUpdatedAt,
    onSaveTitle,
    onCancel,
}: DashboardHeaderProps) => {
    const [pageLoadedAt] = useState(new Date());
    const timeAgo = useTimeAgo(pageLoadedAt);
    const { projectUuid, dashboardUuid } = useParams<{
        projectUuid: string;
        dashboardUuid: string;
    }>();
    const history = useHistory();
    const { track } = useTracking();
    const [isUpdating, setIsUpdating] = useState(false);

    // TODO: on rename tracking is not working
    const onRename = (value: string) => {
        track({
            name: EventName.UPDATE_DASHBOARD_NAME_CLICKED,
        });
        onSaveTitle(value);
    };

    const { user } = useApp();

    if (user.data?.ability?.cannot('manage', 'Dashboard')) return <></>;

    return (
        <PageHeaderContainer>
            <PageTitleAndDetailsContainer>
                <PageTitleContainer className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
                    <PageTitle>{dashboardName}</PageTitle>

                    {dashboardDescription && (
                        <Tooltip2
                            content={dashboardDescription}
                            position="bottom"
                        >
                            <Button icon="info-sign" minimal />
                        </Tooltip2>
                    )}

                    {user.data?.ability?.can('manage', 'Dashboard') && (
                        <Button
                            icon="edit"
                            disabled={isSaving}
                            onClick={() => setIsUpdating(true)}
                            minimal
                        />
                    )}

                    <UpdateDashboardModal
                        dashboardUuid={dashboardUuid}
                        isOpen={isUpdating}
                        onClose={() => setIsUpdating(false)}
                    />
                </PageTitleContainer>

                <PageDetailsContainer>
                    Last refreshed <b>{timeAgo}</b>
                    <SeparatorDot icon="dot" size={6} />
                    <UpdatedInfo
                        updatedAt={dashboardUpdatedAt}
                        user={dashboardUpdatedByUser}
                    />
                </PageDetailsContainer>
            </PageTitleAndDetailsContainer>

            {isEditMode ? (
                <>
                    <AddTileButton onAddTiles={onAddTiles} />
                    <Tooltip2
                        position="top"
                        content={
                            !hasDashboardChanged
                                ? 'No changes to save'
                                : undefined
                        }
                    >
                        <Button
                            text="Save"
                            disabled={!hasDashboardChanged || isSaving}
                            intent={Intent.PRIMARY}
                            onClick={onSaveDashboard}
                        />
                    </Tooltip2>
                    <Button
                        text="Cancel"
                        disabled={isSaving}
                        onClick={onCancel}
                    />
                </>
            ) : (
                <>
                    <Button
                        icon="edit"
                        text="Edit dashboard"
                        onClick={() => {
                            history.replace(
                                `/projects/${projectUuid}/dashboards/${dashboardUuid}/edit`,
                            );
                        }}
                    />

                    <ShareLinkButton
                        url={`${window.location.origin}/projects/${projectUuid}/dashboards/${dashboardUuid}/view`}
                    />
                </>
            )}
        </PageHeaderContainer>
    );
};

export default DashboardHeader;
