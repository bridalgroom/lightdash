import {
    DimensionType,
    isDimension,
    isField,
    isTimeInterval,
    MetricType,
    timeFrameConfigs,
} from '@lightdash/common';
import { Group, Highlight, NavLink, Text, Tooltip } from '@mantine/core';
import { darken, lighten } from 'polished';
import { FC } from 'react';
import { useToggle } from 'react-use';

import { IconAlertTriangle, IconFilter } from '@tabler/icons-react';
import { getItemBgColor } from '../../../../../hooks/useColumns';
import { useFilters } from '../../../../../hooks/useFilters';
import FieldIcon from '../../../../common/Filters/FieldIcon';
import MantineIcon from '../../../../common/MantineIcon';
import { Node, useTableTreeContext } from './TreeProvider';
import TreeSingleNodeActions from './TreeSingleNodeActions';

export const getItemIconName = (type: DimensionType | MetricType) => {
    switch (type) {
        case DimensionType.STRING || MetricType.STRING:
            return 'citation';
        case DimensionType.NUMBER || MetricType.NUMBER:
            return 'numerical';
        case DimensionType.DATE || MetricType.DATE:
            return 'calendar';
        case DimensionType.BOOLEAN || MetricType.BOOLEAN:
            return 'segmented-control';
        case DimensionType.TIMESTAMP:
            return 'time';
        default:
            return 'numerical';
    }
};

const TreeSingleNode: FC<{ node: Node }> = ({ node }) => {
    const { isFilteredField } = useFilters();

    const [isHover, toggle] = useToggle(false);
    const [isMenuOpen, toggleMenu] = useToggle(false);
    const {
        itemsMap,
        selectedItems,
        isSearching,
        searchResults,
        searchQuery,
        onItemClick,
    } = useTableTreeContext();

    const isSelected = selectedItems.has(node.key);
    const isVisible = !isSearching || searchResults.has(node.key);
    const item = itemsMap[node.key];

    if (!item || !isVisible) return null;

    const timeIntervalLabel =
        isDimension(item) &&
        item.timeInterval &&
        isTimeInterval(item.timeInterval)
            ? timeFrameConfigs[item.timeInterval].getLabel()
            : undefined;

    const isFiltered = isField(item) && isFilteredField(item);

    const label = timeIntervalLabel || item.label || item.name;

    const bgColor = getItemBgColor(item);

    return (
        <NavLink
            sx={{
                backgroundColor: isSelected ? bgColor : undefined,
                '&:hover': {
                    backgroundColor: isSelected
                        ? darken(0.02, bgColor)
                        : lighten(0.1, bgColor),
                },
            }}
            icon={
                <FieldIcon
                    item={item}
                    color={isDimension(item) ? 'blue.9' : 'yellow.9'}
                    size="md"
                />
            }
            onClick={() => onItemClick(node.key, item)}
            onMouseEnter={() => toggle(true)}
            onMouseLeave={() => toggle(false)}
            noWrap
            label={
                <Group position="apart">
                    <Tooltip
                        withArrow
                        inline
                        openDelay={500}
                        disabled={!item.description}
                        label={<Text truncate>{item.description}</Text>}
                        position="top-start"
                        maw={350}
                    >
                        <Highlight
                            component={Text}
                            highlight={searchQuery || ''}
                            truncate
                        >
                            {label}
                        </Highlight>
                    </Tooltip>

                    <Group spacing="xs">
                        {isFiltered && (
                            <Tooltip withArrow label="This field is filtered">
                                <MantineIcon icon={IconFilter} color="gray.7" />
                            </Tooltip>
                        )}

                        {item.hidden && (
                            <Tooltip
                                withArrow
                                label="This field has been hidden in the dbt project. It's recommend to remove it from the query"
                            >
                                <MantineIcon
                                    icon={IconAlertTriangle}
                                    color="yellow.9"
                                />
                            </Tooltip>
                        )}
                    </Group>
                </Group>
            }
            rightSection={
                <TreeSingleNodeActions
                    item={item}
                    isHovered={isHover}
                    isSelected={isSelected}
                    isMenuOpen={isMenuOpen}
                    onMenuChange={toggleMenu}
                />
            }
        />
    );
};

export default TreeSingleNode;
