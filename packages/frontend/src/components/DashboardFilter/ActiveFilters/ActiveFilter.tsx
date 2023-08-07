import { DashboardFilterRule, FilterableField } from '@lightdash/common';
import { Popover, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FC, useCallback, useState } from 'react';
import { useDashboardContext } from '../../../providers/DashboardProvider';
import {
    getConditionalRuleLabel,
    getFilterRuleTables,
} from '../../common/Filters/configs';
import FilterConfiguration, { FilterTabs } from '../FilterConfiguration';
import { FilterModalContainer } from '../FilterSearch/FilterSearch.styles';
import { FilterValues, TagContainer } from './ActiveFilters.styles';

type Props = {
    isEditMode: boolean;
    field: FilterableField;
    filterRule: DashboardFilterRule;
    onRemove: () => void;
    onUpdate: (value: DashboardFilterRule) => void;
};

const ActiveFilter: FC<Props> = ({
    isEditMode,
    field,
    filterRule,
    onRemove,
    onUpdate,
}) => {
    const {
        dashboard,
        dashboardTiles,
        allFilterableFields,
        filterableFieldsByTileUuid,
    } = useDashboardContext();

    const originalFilterRule = dashboard?.filters?.dimensions.find(
        (item) => item.id === filterRule.id,
    );

    const [isPopoverOpen, { close: closePopover, toggle: togglePopover }] =
        useDisclosure();
    const [isSubPopoverOpen, { close: closeSubPopover, open: openSubPopover }] =
        useDisclosure();

    const handleClose = useCallback(() => {
        closeSubPopover();
        closePopover();
    }, [closeSubPopover, closePopover]);

    const [selectedTabId, setSelectedTabId] = useState<FilterTabs>();

    if (!filterableFieldsByTileUuid || !allFilterableFields) {
        return null;
    }

    const filterRuleLabels = getConditionalRuleLabel(filterRule, field);
    const filterRuleTables = getFilterRuleTables(
        filterRule,
        field,
        allFilterableFields,
    );

    return (
        <Popover
            position="bottom-start"
            withArrow
            shadow="md"
            opened={isPopoverOpen}
            closeOnEscape={!isSubPopoverOpen}
            closeOnClickOutside={!isSubPopoverOpen}
            onClose={handleClose}
        >
            <Popover.Target>
                <Tooltip
                    withinPortal
                    position="top-start"
                    label={
                        filterRuleTables.length === 0
                            ? `Table: ${filterRuleTables[0]}`
                            : `Tables: ${filterRuleTables.join(', ')}`
                    }
                >
                    <div>
                        <TagContainer
                            interactive
                            onRemove={onRemove}
                            onClick={togglePopover}
                        >
                            {filterRule.label || filterRuleLabels.field}:{' '}
                            {filterRule.disabled ? (
                                <>is any value</>
                            ) : (
                                <>
                                    {filterRuleLabels.operator}{' '}
                                    <FilterValues>
                                        {filterRuleLabels.value}
                                    </FilterValues>
                                </>
                            )}
                        </TagContainer>
                    </div>
                </Tooltip>
            </Popover.Target>

            {/* FIXME: remove p={0} once we remove Blueprint popover from FilterSearch */}
            <Popover.Dropdown p={0}>
                <FilterModalContainer $wide={selectedTabId === 'tiles'}>
                    <FilterConfiguration
                        isActiveFilter
                        isEditMode={isEditMode}
                        tiles={dashboardTiles}
                        selectedTabId={selectedTabId}
                        field={field}
                        availableTileFilters={filterableFieldsByTileUuid}
                        originalFilterRule={originalFilterRule}
                        filterRule={filterRule}
                        onTabChange={setSelectedTabId}
                        onSave={(dashboardFilterRule) => {
                            onUpdate(dashboardFilterRule);
                            handleClose();
                        }}
                        // FIXME: get rid of this once we migrate off Blueprint
                        popoverProps={{
                            onOpened: () => openSubPopover(),
                            onOpening: () => openSubPopover(),
                            onClose: () => closeSubPopover(),
                            onClosing: () => closeSubPopover(),
                        }}
                    />
                </FilterModalContainer>
            </Popover.Dropdown>
        </Popover>
    );
};

export default ActiveFilter;
