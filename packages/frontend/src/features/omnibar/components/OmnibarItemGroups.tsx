import { Accordion, Text } from '@mantine/core';
import { FC, useMemo } from 'react';
import { SearchItem, SearchItemType } from '../types/searchItem';
import { getSearchItemLabel } from '../utils/getSearchItemLabel';
import OmnibarItem from './OmnibarItem';

type Props = {
    openPanels: SearchItemType[];
    onOpenPanelsChange: (panels: SearchItemType[]) => void;
    items: SearchItem[];
    projectUuid: string;
    canUserManageValidation: boolean;
    onClick: (item: SearchItem) => void;
};

type GroupedItems = Partial<Record<SearchItemType, SearchItem[]>>;

const OmnibarItemGroups: FC<Props> = ({
    openPanels,
    onOpenPanelsChange,
    projectUuid,
    items,
    canUserManageValidation,
    onClick,
}) => {
    const itemsGroupedByType = useMemo(() => {
        return items.reduce<GroupedItems>((acc, item) => {
            return { ...acc, [item.type]: (acc[item.type] ?? []).concat(item) };
        }, {});
    }, [items]);

    const sortedGroupEntries = useMemo(() => {
        const entries = Object.entries(itemsGroupedByType) as Array<
            [SearchItemType, Array<SearchItem>]
        >;

        return entries.sort(([_typeA, itemsA], [_typeB, ItemsB]) => {
            return (itemsA[0].searchRank ?? 0) - (ItemsB[0].searchRank ?? 0);
        });
    }, [itemsGroupedByType]);

    return (
        <Accordion
            styles={(theme) => ({
                control: {
                    height: theme.spacing.xxl,
                    paddingLeft: theme.spacing.md,
                    paddingRight: theme.spacing.md,
                    backgroundColor: theme.colors.gray[0],
                    '&:hover': {
                        backgroundColor: theme.colors.gray[1],
                    },
                },
                label: {
                    padding: 0,
                },
                content: {
                    padding: theme.spacing.xs,
                },
            })}
            multiple
            value={openPanels}
            onChange={(newPanels: SearchItemType[]) =>
                onOpenPanelsChange(newPanels)
            }
        >
            {sortedGroupEntries.map(([type, groupItems]) => (
                <Accordion.Item key={type} value={type}>
                    <Accordion.Control>
                        <Text color="dark" fw={500} fz="xs">
                            {getSearchItemLabel(type)}
                        </Text>
                    </Accordion.Control>

                    <Accordion.Panel>
                        {groupItems.map((item) => (
                            <OmnibarItem
                                key={item.location.pathname}
                                item={item}
                                onClick={() => onClick(item)}
                                projectUuid={projectUuid}
                                canUserManageValidation={
                                    canUserManageValidation
                                }
                            />
                        ))}
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
        </Accordion>
    );
};

export default OmnibarItemGroups;
