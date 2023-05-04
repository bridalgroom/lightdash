import {
    AdditionalMetric,
    CompiledTable,
    Dimension,
    Explore,
    getItemId,
    Metric,
} from '@lightdash/common';
import { ActionIcon, Box, Center, Text, TextInput } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';
import MantineIcon from '../../common/MantineIcon';
import TableTree from './TableTree';
import { getSearchResults } from './TableTree/Tree/TreeProvider';

type ExploreTreeProps = {
    explore: Explore;
    additionalMetrics: AdditionalMetric[];
    onSelectedFieldChange: (fieldId: string, isDimension: boolean) => void;
    selectedNodes: Set<string>;
};

type Records = Record<string, AdditionalMetric | Dimension | Metric>;

const ExploreTree: FC<ExploreTreeProps> = ({
    explore,
    additionalMetrics,
    selectedNodes,
    onSelectedFieldChange,
}) => {
    const [search, setSearch] = useState<string>('');
    const isSearching = !!search && search !== '';

    const searchHasResults = useCallback(
        (table: CompiledTable) => {
            const allValues = Object.values({
                ...table.dimensions,
                ...table.metrics,
            });
            const allFields = [
                ...allValues,
                ...additionalMetrics,
            ].reduce<Records>((acc, item) => {
                return { ...acc, [getItemId(item)]: item };
            }, {});

            return getSearchResults(allFields, search).size > 0;
        },
        [additionalMetrics, search],
    );

    const tableTrees = useMemo(() => {
        return Object.values(explore.tables)
            .sort((tableA) => (tableA.name === explore.baseTable ? -1 : 1))
            .filter((table) => !(isSearching && !searchHasResults(table)));
    }, [explore, searchHasResults, isSearching]);

    return (
        <>
            <TextInput
                icon={<MantineIcon icon={IconSearch} />}
                rightSection={
                    search ? (
                        <ActionIcon onClick={() => setSearch('')}>
                            <MantineIcon icon={IconX} />
                        </ActionIcon>
                    ) : null
                }
                placeholder="Search metrics + dimensions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <Box style={{ flexGrow: 1, overflowY: 'auto' }}>
                {tableTrees.length > 0 ? (
                    tableTrees.map((table) => (
                        <TableTree
                            key={table.name}
                            searchQuery={search}
                            showTableLabel={
                                Object.keys(explore.tables).length > 1
                            }
                            table={table}
                            additionalMetrics={additionalMetrics?.filter(
                                (metric) => metric.table === table.name,
                            )}
                            selectedItems={selectedNodes}
                            onSelectedNodeChange={onSelectedFieldChange}
                        />
                    ))
                ) : (
                    <Center>
                        <Text color="dimmed">No fields found...</Text>
                    </Center>
                )}
            </Box>
        </>
    );
};

export default ExploreTree;
