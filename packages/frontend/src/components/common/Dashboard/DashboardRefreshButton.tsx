import { Button, Menu, Text, Tooltip } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import { IconChevronDown, IconRefresh } from '@tabler/icons-react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardRefresh } from '../../../hooks/dashboard/useDashboardRefresh';
import useToaster from '../../../hooks/toaster/useToaster';
import { useDashboardContext } from '../../../providers/DashboardProvider';
import MantineIcon from '../MantineIcon';

const REFRESH_INTERVAL_OPTIONS = [
    {
        value: '0.5',
        label: '30s',
    },
    {
        value: '2',
        label: '1m',
    },
    {
        value: '5',
        label: '5m',
    },
    {
        value: '15',
        label: '15m',
    },
    {
        value: '30',
        label: '30m',
    },
    {
        value: '60',
        label: '1h',
    },
    {
        value: '120',
        label: '2h',
    },
];

const DashboardRefreshButtonWithAutoRefresh = () => {
    const { showToastSuccess } = useToaster();
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<
        undefined | number
    >();

    const { isFetching, invalidateDashboardRelatedQueries } =
        useDashboardRefresh();
    const { clearCacheAndFetch } = useDashboardContext();

    const isOneAtLeastFetching = isFetching > 0;

    const invalidateAndSetRefreshTime = useCallback(() => {
        clearCacheAndFetch();
        invalidateDashboardRelatedQueries();
        setLastRefreshTime(new Date());
    }, [clearCacheAndFetch, invalidateDashboardRelatedQueries]);

    const interval = useInterval(
        () => invalidateAndSetRefreshTime(),
        refreshInterval ? refreshInterval * 1000 * 60 : 0,
    );

    useEffect(() => {
        if (refreshInterval !== undefined) {
            interval.start();
        }
        return interval.stop;
    }, [interval, refreshInterval, showToastSuccess]);

    return (
        <Button.Group>
            <Tooltip
                withinPortal
                position="bottom"
                label={
                    <Text>
                        Last refreshed at:{' '}
                        {lastRefreshTime
                            ? lastRefreshTime.toLocaleTimeString()
                            : 'Never'}
                    </Text>
                }
            >
                <Button
                    size="xs"
                    h={28}
                    miw="sm"
                    variant="default"
                    loading={isOneAtLeastFetching}
                    loaderPosition="center"
                    onClick={() => {
                        invalidateAndSetRefreshTime();
                    }}
                >
                    {intervalIdRef && refreshInterval ? (
                        <Text
                            span
                            mr="xs"
                            c={isOneAtLeastFetching ? 'transparent' : 'gray.7'}
                        >
                            Every{' '}
                            {
                                REFRESH_INTERVAL_OPTIONS.find(
                                    ({ value }) => refreshInterval === +value,
                                )?.label
                            }
                        </Text>
                    ) : null}
                    <MantineIcon
                        icon={IconRefresh}
                        color={isOneAtLeastFetching ? 'transparent' : 'black'}
                    />
                </Button>
            </Tooltip>
            <Menu
                withinPortal
                withArrow
                closeOnItemClick
                closeOnClickOutside
                opened={isOpen}
                onClose={() => setIsOpen((prev) => !prev)}
            >
                <Menu.Target>
                    <Button
                        size="xs"
                        variant="default"
                        h={28}
                        w="md"
                        disabled={isOneAtLeastFetching}
                        p={0}
                        onClick={() => setIsOpen((prev) => !prev)}
                    >
                        <MantineIcon size="sm" icon={IconChevronDown} />
                    </Button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Auto-refresh</Menu.Label>
                    <Menu.Item
                        fz="xs"
                        onClick={() => {
                            setRefreshInterval(undefined);
                        }}
                        disabled={refreshInterval === undefined}
                        bg={refreshInterval === undefined ? 'blue' : 'white'}
                        sx={{
                            '&[disabled]': {
                                color:
                                    refreshInterval === undefined
                                        ? 'white'
                                        : 'black',
                            },
                        }}
                    >
                        Off
                    </Menu.Item>
                    {REFRESH_INTERVAL_OPTIONS.map(({ value, label }) => (
                        <Menu.Item
                            fz="xs"
                            key={value}
                            onClick={() => {
                                setRefreshInterval(+value);
                                showToastSuccess({
                                    title: `Your dashboard will refresh every ${
                                        REFRESH_INTERVAL_OPTIONS.find(
                                            (option) => value === option.value,
                                        )?.label
                                    }`,
                                });
                            }}
                            bg={refreshInterval === +value ? 'blue' : 'white'}
                            disabled={refreshInterval === +value}
                            sx={{
                                '&[disabled]': {
                                    color:
                                        refreshInterval === +value
                                            ? 'white'
                                            : 'black',
                                },
                            }}
                        >
                            {label}
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        </Button.Group>
    );
};

const DashboardRefreshButtonWithoutAutoRefresh = () => {
    const { isFetching, invalidateDashboardRelatedQueries } =
        useDashboardRefresh();
    const { clearCacheAndFetch } = useDashboardContext();

    const isOneAtLeastFetching = isFetching > 0;

    return (
        <Button
            size="xs"
            loading={isOneAtLeastFetching}
            leftIcon={<MantineIcon icon={IconRefresh} />}
            onClick={() => {
                clearCacheAndFetch();
                invalidateDashboardRelatedQueries();
            }}
        >
            Refresh
        </Button>
    );
};

export const DashboardRefreshButton = () => {
    const isAutoRefreshFeatureEnabled = useFeatureFlagEnabled(
        'dashboard-auto-refresh',
    );

    if (isAutoRefreshFeatureEnabled) {
        return <DashboardRefreshButtonWithAutoRefresh />;
    }

    return <DashboardRefreshButtonWithoutAutoRefresh />;
};
