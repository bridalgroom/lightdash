import { DateGranularity } from '@lightdash/common';
import { Button, Menu, Text, useMantineTheme } from '@mantine/core';
import {
    IconCalendarSearch,
    IconChevronDown,
    IconChevronUp,
} from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import MantineIcon from '../../../components/common/MantineIcon';
import { useDashboardContext } from '../../../providers/DashboardProvider';

type Props = {
    isEditMode: boolean;
};

export const DateZoom: FC<Props> = ({ isEditMode }) => {
    const theme = useMantineTheme();
    const [isOpen, setIsOpen] = useState(false);

    const dateZoomGranularity = useDashboardContext(
        (c) => c.dateZoomGranularity,
    );
    const setDateZoomGranularity = useDashboardContext(
        (c) => c.setDateZoomGranularity,
    );

    useEffect(() => {
        if (isEditMode) setDateZoomGranularity(undefined);
    }, [isEditMode, setDateZoomGranularity]);

    return (
        <Menu
            withinPortal
            withArrow
            closeOnItemClick
            closeOnClickOutside
            opened={isOpen}
            offset={-1}
            position="bottom-end"
            disabled={isEditMode}
        >
            <Menu.Target>
                <Button
                    size="xs"
                    variant="default"
                    loaderPosition="center"
                    disabled={isEditMode}
                    onClick={() => {
                        setIsOpen((prev) => !prev);
                    }}
                    sx={{
                        borderColor: dateZoomGranularity
                            ? theme.colors.blue['6']
                            : 'default',
                    }}
                    leftIcon={<MantineIcon icon={IconCalendarSearch} />}
                    rightIcon={
                        <MantineIcon
                            icon={isOpen ? IconChevronUp : IconChevronDown}
                        />
                    }
                >
                    <Text>
                        Date Zoom
                        {dateZoomGranularity ? `:` : null}{' '}
                        {dateZoomGranularity ? (
                            <Text span fw={500}>
                                {dateZoomGranularity}
                            </Text>
                        ) : null}
                    </Text>
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label fz={10}>Granularity</Menu.Label>
                <Menu.Item
                    fz="xs"
                    onClick={() => {
                        setDateZoomGranularity(undefined);
                        setIsOpen(false);
                    }}
                    bg={
                        dateZoomGranularity === undefined
                            ? theme.colors.blue['6']
                            : 'white'
                    }
                    disabled={dateZoomGranularity === undefined}
                    sx={{
                        '&[disabled]': {
                            color:
                                dateZoomGranularity === undefined
                                    ? 'white'
                                    : 'black',
                        },
                    }}
                >
                    Default
                </Menu.Item>
                {Object.values(DateGranularity).map((granularity) => (
                    <Menu.Item
                        fz="xs"
                        key={granularity}
                        onClick={() => {
                            setDateZoomGranularity(dateZoomGranularity);
                            setIsOpen(false);
                        }}
                        disabled={dateZoomGranularity === granularity}
                        bg={
                            dateZoomGranularity === granularity
                                ? theme.colors.blue['6']
                                : 'white'
                        }
                        sx={{
                            '&[disabled]': {
                                color:
                                    dateZoomGranularity === granularity
                                        ? 'white'
                                        : 'black',
                            },
                        }}
                    >
                        {granularity}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
};
