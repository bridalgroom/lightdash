import { NonIdealState } from '@blueprintjs/core';
import { ActionIcon, Skeleton, Stack, TextInput } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import Fuse from 'fuse.js';
import { memo, useCallback, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { useExplores } from '../../../hooks/useExplores';
import { useExplorerContext } from '../../../providers/ExplorerProvider';
import { TrackSection } from '../../../providers/TrackingProvider';
import { SectionName } from '../../../types/Events';
import MantineIcon from '../../common/MantineIcon';
import PageBreadcrumbs from '../../common/PageBreadcrumbs';
import ExplorePanel from '../ExplorePanel';
import ExploreNavLink from './ExploreNavLink';

const LoadingSkeleton = () => (
    <Stack>
        <Skeleton h="md" />

        <Skeleton h="xxl" />

        <Stack spacing="xxs">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                <Skeleton key={index} h="xxl" />
            ))}
        </Stack>
    </Stack>
);

const BasePanel = () => {
    const history = useHistory();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const [search, setSearch] = useState<string>('');
    const exploresResult = useExplores(projectUuid, true);

    const filteredTables = useMemo(() => {
        const validSearch = search ? search.toLowerCase() : '';
        if (exploresResult.data) {
            if (validSearch !== '') {
                return new Fuse(Object.values(exploresResult.data), {
                    keys: ['label'],
                    ignoreLocation: true,
                    threshold: 0.3,
                })
                    .search(validSearch)
                    .map((res) => res.item);
            }
            return Object.values(exploresResult.data);
        }
        return [];
    }, [exploresResult.data, search]);

    if (exploresResult.status === 'loading') {
        return <LoadingSkeleton />;
    }

    if (exploresResult.status === 'error') {
        return <NonIdealState icon="error" title="Could not load explores" />;
    }

    if (exploresResult.data) {
        return (
            <>
                <PageBreadcrumbs
                    size="md"
                    items={[{ title: 'Tables', active: true }]}
                />

                <TextInput
                    icon={<MantineIcon icon={IconSearch} />}
                    rightSection={
                        search ? (
                            <ActionIcon onClick={() => setSearch('')}>
                                <MantineIcon icon={IconX} />
                            </ActionIcon>
                        ) : null
                    }
                    placeholder="Search tables"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <Stack spacing="xxs" sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {filteredTables
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map((explore) => (
                            <ExploreNavLink
                                key={explore.name}
                                explore={explore}
                                query={search}
                                onClick={() => {
                                    history.push(
                                        `/projects/${projectUuid}/tables/${explore.name}`,
                                    );
                                }}
                            />
                        ))}
                </Stack>
            </>
        );
    }

    return (
        <NonIdealState icon="warning-sign" title="Could not load explores" />
    );
};

const ExploreSideBar = memo(() => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const tableName = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );

    const clearExplore = useExplorerContext((context) => context.actions.clear);
    const history = useHistory();

    const handleBack = useCallback(() => {
        clearExplore();
        history.push(`/projects/${projectUuid}/tables`);
    }, [clearExplore, history, projectUuid]);

    return (
        <TrackSection name={SectionName.SIDEBAR}>
            <Stack h="100%" sx={{ flexGrow: 1 }}>
                {!tableName ? (
                    <BasePanel />
                ) : (
                    <ExplorePanel onBack={handleBack} />
                )}
            </Stack>
        </TrackSection>
    );
});

export default ExploreSideBar;
