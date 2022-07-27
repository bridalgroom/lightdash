import {
    Colors,
    IconName,
    InputGroup,
    MenuItem,
    Spinner,
} from '@blueprintjs/core';
import { HotkeysTarget2 } from '@blueprintjs/core/lib/esm/components';
import { ItemPredicate, ItemRenderer, Omnibar } from '@blueprintjs/select';
import {
    ApiError,
    Dashboard,
    Dimension,
    Metric,
    SavedChart,
    Space,
    Table,
} from '@lightdash/common';
import React, { FC, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { useDebounce, useToggle } from 'react-use';
import { lightdashApi } from '../../../api';
import { getItemIconName } from '../../Explorer/ExploreTree/TableTree/TableTree';

type SpaceSearchResult = Pick<Space, 'uuid' | 'name'>;
type DashboardSearchResult = Pick<Dashboard, 'uuid' | 'name' | 'description'>;
type SavedChartSearchResult = Pick<SavedChart, 'uuid' | 'name' | 'description'>;
type TableSearchResult = Pick<Table, 'name' | 'label' | 'description'>;
type FieldSearchResult = Pick<
    Dimension | Metric,
    | 'name'
    | 'label'
    | 'description'
    | 'type'
    | 'fieldType'
    | 'table'
    | 'tableLabel'
> & {
    explore: string;
    exploreLabel: string;
};

type SearchResults = {
    spaces: SpaceSearchResult[];
    dashboards: DashboardSearchResult[];
    savedCharts: SavedChartSearchResult[];
    tables: TableSearchResult[];
    fields: FieldSearchResult[];
};

export const getSearchResults = async ({
    projectUuid,
    query,
}: {
    projectUuid: string;
    query: string;
}) =>
    lightdashApi<any>({
        url: `/projects/${projectUuid}/search/${query}`,
        method: 'GET',
        body: undefined,
    });

export const useGlobalSearch = (projectUuid: string, query: string = '') => {
    return useQuery<SearchResults, ApiError>({
        queryKey: ['global-search', query],
        queryFn: () =>
            getSearchResults({
                projectUuid,
                query,
            }),
        retry: false,
        enabled: query.length > 2,
        keepPreviousData: true,
    });
};

type SearchItem = {
    icon: IconName;
    name: string;
    prefix?: string;
    description?: string;
    meta?:
        | SpaceSearchResult
        | DashboardSearchResult
        | SavedChartSearchResult
        | TableSearchResult
        | FieldSearchResult;
};

const getSearchItemId = (meta: SearchItem['meta']) => {
    // @ts-ignore
    return meta ? meta.uuid || `${meta.explore}${meta.table}${meta.name}` : '';
};

const SearchOmnibar = Omnibar.ofType<SearchItem>();

const renderItem: ItemRenderer<SearchItem> = (
    field,
    { modifiers, handleClick },
) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            key={getSearchItemId(field.meta)}
            selected={modifiers.active}
            disabled={modifiers.disabled}
            icon={field.icon}
            text={
                <>
                    <span>
                        {field.prefix && <span>{field.prefix} - </span>}
                        <b>{field.name}</b>
                    </span>
                    <span style={{ marginLeft: 10, color: Colors.GRAY1 }}>
                        {field.description}
                    </span>
                </>
            }
            title={field.description}
            onClick={handleClick}
            shouldDismissPopover={false}
        />
    );
};

const filterSearch: ItemPredicate<SearchItem> = (query, item) => {
    return (
        `${item.name.toLowerCase()} ${item.description?.toLowerCase()}`.indexOf(
            query.toLowerCase(),
        ) >= 0
    );
};

const GlobalSearch: FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const [isSearchOpen, toggleSearchOpen] = useToggle(false);
    const [query, setQuery] = useState<string>();
    const [debouncedQuery, setDebouncedQuery] = useState<string>();

    const isSearching = query !== debouncedQuery && query && query?.length > 2;

    useDebounce(
        () => {
            setDebouncedQuery(query);
        },
        500,
        [query],
    );
    const { data } = useGlobalSearch(projectUuid, debouncedQuery);

    const items = useMemo(() => {
        const spaces =
            data?.spaces.map<SearchItem>((item) => ({
                icon: 'folder-open',
                name: item.name,
                meta: item,
            })) || [];

        const dashboards =
            data?.dashboards.map<SearchItem>((item) => ({
                icon: 'control',
                name: item.name,
                description: item.description,
                meta: item,
            })) || [];

        const saveCharts =
            data?.savedCharts.map<SearchItem>((item) => ({
                icon: 'chart',
                name: item.name,
                description: item.description,
                meta: item,
            })) || [];

        const tables =
            data?.tables.map<SearchItem>((item) => ({
                icon: 'th',
                name: item.label,
                description: item.description,
                meta: item,
            })) || [];

        const fields =
            data?.fields.map<SearchItem>((item) => ({
                icon: getItemIconName(item.type),
                prefix: `${item.exploreLabel} - ${item.tableLabel}`,
                name: item.label,
                description: item.description,
                meta: item,
            })) || [];

        return [...spaces, ...dashboards, ...saveCharts, ...tables, ...fields];
    }, [data]);

    return (
        <HotkeysTarget2
            hotkeys={[
                {
                    combo: 'cmd + f',
                    global: true,
                    label: 'Show search',
                    onKeyDown: () => toggleSearchOpen(true),
                    preventDefault: true,
                },
            ]}
        >
            <>
                <InputGroup
                    leftIcon="search"
                    onClick={() => toggleSearchOpen(true)}
                    placeholder="Search..."
                    style={{ width: 150 }}
                    value={query}
                />
                <SearchOmnibar
                    inputProps={{
                        leftElement: isSearching ? (
                            <Spinner size={16} style={{ margin: 12 }} />
                        ) : undefined,
                    }}
                    isOpen={isSearchOpen}
                    itemRenderer={renderItem}
                    query={query}
                    items={items}
                    itemsEqual={(a, b) =>
                        getSearchItemId(a.meta) === getSearchItemId(b.meta)
                    }
                    initialContent={
                        <MenuItem
                            disabled={true}
                            text="Type to search everything in the project"
                        />
                    }
                    noResults={
                        <MenuItem
                            disabled={true}
                            text={isSearching ? 'Searching...' : 'No results.'}
                        />
                    }
                    onItemSelect={() => toggleSearchOpen(false)}
                    onClose={() => toggleSearchOpen(false)}
                    resetOnSelect={true}
                    onQueryChange={(value) => setQuery(value)}
                    itemPredicate={filterSearch}
                />
            </>
        </HotkeysTarget2>
    );
};

export default GlobalSearch;
