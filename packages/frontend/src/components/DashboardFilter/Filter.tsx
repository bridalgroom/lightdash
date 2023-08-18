import {
    applyDefaultTileTargets,
    DashboardFilterRule,
    DashboardTileTypes,
    FilterableField,
} from '@lightdash/common';
import { Button, CloseButton, Popover, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { FC, useCallback } from 'react';
import { useDashboardContext } from '../../providers/DashboardProvider';
import {
    getConditionalRuleLabel,
    getFilterRuleTables,
} from '../common/Filters/configs';
import MantineIcon from '../common/MantineIcon';
import FilterConfiguration from './FilterConfiguration';

type Props = {
    isEditMode: boolean;
    isCreatingNew?: boolean;
    isTemporary?: boolean;
    field?: FilterableField;
    filterRule?: DashboardFilterRule;
    onSave?: (value: DashboardFilterRule) => void;
    onUpdate?: (filter: DashboardFilterRule) => void;
    onRemove?: () => void;
};

const Filter: FC<Props> = ({
    isEditMode,
    isCreatingNew,
    isTemporary,
    field,
    filterRule,
    onSave,
    onUpdate,
    onRemove,
}) => {
    const {
        dashboard,
        dashboardTiles,
        allFilterableFields,
        filterableFieldsByTileUuid,
    } = useDashboardContext();

    const [isPopoverOpen, { close: closePopover, toggle: togglePopover }] =
        useDisclosure();
    const [isSubPopoverOpen, { close: closeSubPopover, open: openSubPopover }] =
        useDisclosure();

    const defaultFilterRule =
        filterableFieldsByTileUuid && filterRule && field
            ? applyDefaultTileTargets(
                  filterRule,
                  field,
                  filterableFieldsByTileUuid,
              )
            : undefined;

    // Only used by active filters
    const originalFilterRule = dashboard?.filters?.dimensions.find(
        (item) => filterRule && item.id === filterRule.id,
    );

    //Only used by Add filters
    const hasChartTiles =
        dashboardTiles.filter(
            (tile) => tile.type === DashboardTileTypes.SAVED_CHART,
        ).length >= 1;

    const filterRuleLabels =
        filterRule && field
            ? getConditionalRuleLabel(filterRule, field)
            : undefined;
    const filterRuleTables =
        filterRule && field && allFilterableFields
            ? getFilterRuleTables(filterRule, field, allFilterableFields)
            : undefined;

    const handleClose = useCallback(() => {
        closeSubPopover();
        closePopover();
    }, [closeSubPopover, closePopover]);

    const handelSaveChanges = useCallback(
        (newRule: DashboardFilterRule) => {
            if (isCreatingNew && onSave) {
                onSave(newRule);
            } else if (onUpdate) {
                onUpdate(newRule);
            }
            handleClose();
        },
        [isCreatingNew, onSave, onUpdate, handleClose],
    );

    if (!filterableFieldsByTileUuid || !allFilterableFields) {
        return null;
    }

    return (
        <Popover
            position="bottom-start"
            trapFocus
            opened={isPopoverOpen}
            closeOnEscape={!isSubPopoverOpen}
            closeOnClickOutside={!isSubPopoverOpen}
            onClose={handleClose}
            disabled={!hasChartTiles}
            transitionProps={{
                transition: 'pop',
            }}
            withArrow
            shadow="md"
            offset={-1}
        >
            <Popover.Target>
                {isCreatingNew ? (
                    <Tooltip
                        disabled={isPopoverOpen || isEditMode}
                        position="top-start"
                        withinPortal
                        offset={0}
                        arrowOffset={16}
                        label={
                            <Text fz="xs">
                                Only filters added in{' '}
                                <Text span fw={600}>
                                    'edit'
                                </Text>{' '}
                                mode will be saved
                            </Text>
                        }
                    >
                        <Button
                            size="xs"
                            variant="default"
                            leftIcon={
                                <MantineIcon color="blue" icon={IconFilter} />
                            }
                            disabled={!hasChartTiles}
                            onClick={togglePopover}
                        >
                            Add filter
                        </Button>
                    </Tooltip>
                ) : (
                    <Button
                        size="xs"
                        variant={isTemporary ? 'outline' : 'default'}
                        bg="white"
                        mr="xxs"
                        rightIcon={
                            (isEditMode || isTemporary) && (
                                <CloseButton size="sm" onClick={onRemove} />
                            )
                        }
                        styles={{
                            inner: {
                                color: 'black',
                            },
                        }}
                        onClick={togglePopover}
                    >
                        <Text fz="xs">
                            {' '}
                            <Tooltip
                                withinPortal
                                position="top-start"
                                disabled={isPopoverOpen}
                                offset={8}
                                label={
                                    <Text fz="xs">
                                        {filterRuleTables?.length === 0 ? (
                                            <>
                                                Table:
                                                <Text span fw={600}>
                                                    {filterRuleTables[0]}
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                Tables:{' '}
                                                <Text span fw={600}>
                                                    {filterRuleTables?.join(
                                                        ', ',
                                                    )}
                                                </Text>
                                            </>
                                        )}
                                    </Text>
                                }
                            >
                                <Text fw={600} span>
                                    {filterRule?.label ||
                                        filterRuleLabels?.field}{' '}
                                </Text>
                            </Tooltip>
                            <Text fw={400} span>
                                {!filterRule?.values?.length ? (
                                    <Text span color="gray.6">
                                        is any value
                                    </Text>
                                ) : (
                                    <>
                                        <Text span color="gray.7">
                                            {filterRuleLabels?.operator}{' '}
                                        </Text>
                                        <Text fw={700} span>
                                            {filterRuleLabels?.value}
                                        </Text>
                                    </>
                                )}
                            </Text>
                        </Text>
                    </Button>
                )}
            </Popover.Target>

            <Popover.Dropdown ml={5}>
                <FilterConfiguration
                    isCreatingNew={isCreatingNew}
                    isEditMode={isEditMode}
                    isTemporary={isTemporary}
                    field={field}
                    fields={allFilterableFields || []}
                    tiles={dashboardTiles}
                    originalFilterRule={originalFilterRule}
                    availableTileFilters={filterableFieldsByTileUuid}
                    defaultFilterRule={defaultFilterRule}
                    onSave={handelSaveChanges}
                    // FIXME: remove this once we migrate off of Blueprint
                    popoverProps={{
                        onOpened: () => openSubPopover(),
                        onOpening: () => openSubPopover(),
                        onClose: () => closeSubPopover(),
                        onClosing: () => closeSubPopover(),
                    }}
                />
            </Popover.Dropdown>
        </Popover>
    );
};

export default Filter;
