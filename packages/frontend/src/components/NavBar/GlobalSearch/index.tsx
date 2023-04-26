import { Button, Colors } from '@blueprintjs/core';
import { getSearchResultId } from '@lightdash/common';
import {
    Box,
    createStyles,
    Group,
    Highlight,
    Input,
    Kbd,
    Loader,
    rem,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import {
    spotlight,
    SpotlightAction,
    SpotlightActionProps,
    SpotlightProvider,
} from '@mantine/spotlight';
import { IconSearch } from '@tabler/icons-react';
import { FC, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useProject } from '../../../hooks/useProject';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import MantineIcon from '../../common/MantineIcon';
import { SearchItem, useDebouncedSearch } from './hooks';
import { SearchIcon } from './SearchIcon';

const useStyles = createStyles<string, null>((theme) => ({
    action: {
        width: '100%',
        padding: `${rem(10)} ${rem(12)}`,
        borderRadius: theme.radius.sm,
        ...theme.fn.hover({
            backgroundColor:
                theme.colorScheme === 'dark'
                    ? theme.colors.dark[4]
                    : theme.colors.gray[1],
        }),
        '&[data-hovered]': {
            backgroundColor:
                theme.colorScheme === 'dark'
                    ? theme.colors.dark[4]
                    : theme.colors.gray[1],
        },
    },
}));

const SpotlightItem: FC<SpotlightActionProps> = ({
    action,
    styles,
    classNames,
    hovered,
    onTrigger,
    query,
    // radius,
    // highlightColor,
    // highlightQuery,
}) => {
    const { classes } = useStyles(null, {
        styles,
        classNames,
        name: 'SpotlightItem',
    });

    const item = action.item as SearchItem;

    return (
        <UnstyledButton
            className={classes.action}
            data-hovered={hovered || undefined}
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onTrigger}
        >
            <Group noWrap>
                <Box sx={{ flexShrink: 0 }}>
                    <SearchIcon item={item} color={Colors.GRAY1} />
                </Box>

                <Stack spacing="xxs" sx={{ flexGrow: 1, maxWidth: 530 }}>
                    <Text>
                        <span>{item.prefix}</span>

                        <Highlight
                            component="span"
                            fw={500}
                            highlight={query}
                            truncate
                        >
                            {action.title}
                        </Highlight>
                    </Text>

                    {item.description || item.typeLabel ? (
                        <Text color="dimmed" size="sm" truncate>
                            <Text component="span" fw={500}>
                                {item.typeLabel}
                            </Text>

                            {item.description && item.typeLabel ? (
                                <Text component="span"> · </Text>
                            ) : null}

                            {action.description ? (
                                <Highlight component="span" highlight={query}>
                                    {action.description}
                                </Highlight>
                            ) : null}
                        </Text>
                    ) : null}
                </Stack>
            </Group>
        </UnstyledButton>
    );
};

interface GlobalSearchProps {
    projectUuid: string;
}

const GlobalSearch: FC<GlobalSearchProps> = ({ projectUuid }) => {
    const history = useHistory();
    const location = useLocation();
    const { track } = useTracking();
    const project = useProject(projectUuid);

    const [query, setQuery] = useState<string>();

    const handleSpotlightOpen = () => {
        track({
            name: EventName.GLOBAL_SEARCH_OPEN,
            properties: {
                action: 'hotkeys',
            },
        });
        spotlight.open();
    };

    useHotkeys([
        ['mod + k', () => handleSpotlightOpen, { preventDefault: true }],
    ]);

    const { items, isSearching } = useDebouncedSearch(projectUuid, query);

    const searchItems = useMemo(() => {
        return items.map<SpotlightAction>((item) => ({
            item,
            icon: <SearchIcon item={item} color={Colors.GRAY1} />,
            title: item.title,
            description: item.description,
            onTrigger: () => {
                track({
                    name: EventName.SEARCH_RESULT_CLICKED,
                    properties: {
                        type: item.type,
                        id: getSearchResultId(item.item),
                    },
                });
                track({
                    name: EventName.GLOBAL_SEARCH_CLOSED,
                    properties: {
                        action: 'result_click',
                    },
                });

                history.push(item.location);
                if (
                    (item.location.pathname.includes('/tables/') &&
                        location.pathname.includes('/tables/')) ||
                    (item.location.pathname.includes('/saved/') &&
                        location.pathname.includes('/saved/'))
                ) {
                    history.go(0); // force page refresh so explore page can pick up the new url params
                }
            },
        }));
    }, [items, history, location.pathname, track]);

    return (
        <>
            <Input
                size="xs"
                icon={<MantineIcon icon={IconSearch} />}
                placeholder="Search..."
                onClick={() => {
                    track({
                        name: EventName.GLOBAL_SEARCH_OPEN,
                        properties: {
                            action: 'input_click',
                        },
                    });
                    spotlight.open();
                }}
                rightSection={
                    query ? (
                        <Button icon="cross" onClick={() => setQuery('')} />
                    ) : (
                        <Kbd>mod+k</Kbd>
                    )
                }
            />

            <SpotlightProvider
                actions={query && query.length > 2 ? searchItems : []}
                highlightQuery
                searchIcon={
                    isSearching ? (
                        <Loader size="xs" color="gray" />
                    ) : (
                        <MantineIcon icon={IconSearch} />
                    )
                }
                actionComponent={SpotlightItem}
                closeOnActionTrigger
                searchPlaceholder={`Search ${project.data?.name}...`}
                onQueryChange={setQuery}
                shortcut="mod + k"
                nothingFoundMessage={
                    !query
                        ? 'Start typing to search everything in the project'
                        : query.length < 3
                        ? 'Keep typing to search everything in the project'
                        : isSearching
                        ? 'Searching...'
                        : 'No results.'
                }
                onSpotlightClose={() => {
                    track({
                        name: EventName.GLOBAL_SEARCH_CLOSED,
                        properties: {
                            action: 'default',
                        },
                    });
                }}
            />
        </>
    );
};

export default GlobalSearch;
