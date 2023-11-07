import {
    Button,
    Group,
    Kbd,
    MantineProvider,
    Text,
    Tooltip,
} from '@mantine/core';
import { useHotkeys, useOs } from '@mantine/hooks';
import { IconPlayerPlay } from '@tabler/icons-react';
import { memo, useCallback } from 'react';
import { useExplorerContext } from '../providers/ExplorerProvider';
import { useTracking } from '../providers/TrackingProvider';
import { EventName } from '../types/Events';
import MantineIcon from './common/MantineIcon';

export const RefreshButton = memo(() => {
    const os = useOs();
    const isValidQuery = useExplorerContext(
        (context) => context.state.isValidQuery,
    );
    const isLoading = useExplorerContext(
        (context) => context.queryResults.isLoading,
    );
    const fetchResults = useExplorerContext(
        (context) => context.actions.fetchResults,
    );

    const canRunQuery = isValidQuery;

    const { track } = useTracking();

    const onClick = useCallback(() => {
        if (canRunQuery) {
            fetchResults();
            track({ name: EventName.RUN_QUERY_BUTTON_CLICKED });
        }
    }, [fetchResults, track, canRunQuery]);

    useHotkeys([['mod + enter', onClick, { preventDefault: true }]]);

    return (
        <Tooltip
            label={
                <MantineProvider inherit theme={{ colorScheme: 'dark' }}>
                    <Group spacing="xxs">
                        <Kbd fw={600}>
                            {os === 'macos' || os === 'ios' ? '⌘' : 'ctrl'}
                        </Kbd>

                        <Text fw={600}>+</Text>

                        <Kbd fw={600}>Enter</Kbd>
                    </Group>
                </MantineProvider>
            }
            position="bottom"
            withArrow
            withinPortal
            disabled={isLoading || !isValidQuery}
        >
            <Button
                size="xs"
                leftIcon={<MantineIcon icon={IconPlayerPlay} />}
                loading={isLoading}
                onClick={onClick}
                disabled={!isValidQuery}
            >
                Run query
            </Button>
        </Tooltip>
    );
});
