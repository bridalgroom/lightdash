import { ActionIcon, Box, Menu } from '@mantine/core';
import {
    IconDots,
    IconEdit,
    IconSquarePlus,
    IconTrash,
} from '@tabler/icons-react';
import React, { FC } from 'react';
import { useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import MantineIcon from '../common/MantineIcon';
import SchedulerDeleteModal from '../SchedulerModals/SchedulerModalBase/SchedulerDeleteModal';
import {
    getItemLink,
    getSchedulerLink,
    SchedulerItem,
} from './SchedulersViewUtils';

interface SchedulersViewActionMenuProps {
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    item: SchedulerItem;
    projectUuid: string;
}

const SchedulersViewActionMenu: FC<SchedulersViewActionMenuProps> = ({
    isOpen,
    onClose,
    onOpen,
    item,
    projectUuid,
}) => {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const queryClient = useQueryClient();
    const handleDelete = async () => {
        setIsDeleting(false);
        queryClient.invalidateQueries('schedulerLogs');
    };
    return (
        <>
            <Menu
                withinPortal
                opened={isOpen}
                position="bottom-start"
                withArrow
                arrowPosition="center"
                shadow="md"
                offset={-4}
                closeOnItemClick
                closeOnClickOutside
                onClose={onClose}
            >
                <Menu.Target>
                    <Box onClick={isOpen ? onClose : onOpen}>
                        <ActionIcon
                            sx={(theme) => ({
                                ':hover': {
                                    backgroundColor: theme.colors.gray[1],
                                },
                            })}
                        >
                            <IconDots size={16} />
                        </ActionIcon>
                    </Box>
                </Menu.Target>

                <Menu.Dropdown maw={320}>
                    <Menu.Item
                        component={Link}
                        role="menuitem"
                        icon={<IconEdit size={18} />}
                        to={getSchedulerLink(item, projectUuid)}
                    >
                        Edit schedule
                    </Menu.Item>
                    <Menu.Item
                        component={Link}
                        role="menuitem"
                        icon={<IconSquarePlus size={18} />}
                        to={getItemLink(item, projectUuid)}
                    >
                        Go to {item.savedChartUuid ? 'chart' : 'dashboard'}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                        component="button"
                        role="menuitem"
                        color="red"
                        icon={<MantineIcon icon={IconTrash} size={18} />}
                        onClick={() => setIsDeleting(true)}
                    >
                        Delete schedule
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
            <SchedulerDeleteModal
                lazy={true}
                isOpen={isDeleting}
                schedulerUuid={item.schedulerUuid}
                onConfirm={handleDelete}
                onClose={handleDelete}
            />
        </>
    );
};

export default SchedulersViewActionMenu;
