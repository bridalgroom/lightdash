import { Button, Colors, Icon } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { FC, useState } from 'react';
import { useSpaces } from '../../../hooks/useSpaces';
import LatestCard from '../../Home/LatestCard';
import { CreateSpaceModal } from './CreateSpaceModal';
import { DeleteSpaceModal } from './DeleteSpaceModal';
import { EditSpaceModal } from './EditSpaceModal';
import {
    CreateNewButton,
    SpaceBrowserWrapper,
    SpaceFooter,
    SpaceHeader,
    SpaceItemCount,
    SpaceLinkButton,
    SpaceListWrapper,
    SpaceTitle,
} from './SpaceBrowser.styles';
import { SpaceBrowserMenu } from './SpaceBrowserMenu';

const SpaceBrowser: FC<{ projectUuid: string }> = ({ projectUuid }) => {
    const [updateSpaceUuid, setUpdateSpaceUuid] = useState<string>();
    const [deleteSpaceUuid, setDeleteSpaceUuid] = useState<string>();
    const { data: spaces, isLoading } = useSpaces(projectUuid);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

    return (
        <SpaceBrowserWrapper>
            <LatestCard
                isLoading={isLoading}
                title="Spaces"
                headerAction={
                    <CreateNewButton
                        minimal
                        loading={isLoading}
                        intent="primary"
                        onClick={() => {
                            setIsCreateModalOpen(true);
                        }}
                    >
                        + Create new
                    </CreateNewButton>
                }
            >
                <SpaceListWrapper>
                    {spaces?.map(({ uuid, name, dashboards, queries }) => (
                        <>
                            <SpaceLinkButton
                                key={uuid}
                                minimal
                                outlined
                                href={`/projects/${projectUuid}/spaces/${uuid}`}
                            >
                                <SpaceHeader>
                                    <Icon
                                        icon="folder-close"
                                        size={20}
                                        color={Colors.BLUE5}
                                    ></Icon>
                                    <div
                                        onClick={(e) => {
                                            // prevent clicks in menu to trigger redirect
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                    >
                                        <SpaceBrowserMenu
                                            onRename={() =>
                                                setUpdateSpaceUuid(uuid)
                                            }
                                            onDelete={() =>
                                                setDeleteSpaceUuid(uuid)
                                            }
                                        >
                                            <Tooltip2 content="View options">
                                                <Button minimal icon="more" />
                                            </Tooltip2>
                                        </SpaceBrowserMenu>
                                    </div>
                                </SpaceHeader>
                                <SpaceTitle ellipsize>{name}</SpaceTitle>
                                <SpaceFooter>
                                    <SpaceItemCount
                                        icon="control"
                                        value={dashboards.length}
                                    />
                                    <SpaceItemCount
                                        icon="timeline-bar-chart"
                                        value={queries.length}
                                    />
                                </SpaceFooter>
                            </SpaceLinkButton>
                        </>
                    ))}
                </SpaceListWrapper>
            </LatestCard>

            <CreateSpaceModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                }}
            />

            {updateSpaceUuid && (
                <EditSpaceModal
                    spaceUuid={updateSpaceUuid}
                    onClose={() => {
                        setUpdateSpaceUuid(undefined);
                    }}
                />
            )}

            {deleteSpaceUuid && (
                <DeleteSpaceModal
                    spaceUuid={deleteSpaceUuid}
                    onClose={() => {
                        setDeleteSpaceUuid(undefined);
                    }}
                />
            )}
        </SpaceBrowserWrapper>
    );
};

export default SpaceBrowser;
