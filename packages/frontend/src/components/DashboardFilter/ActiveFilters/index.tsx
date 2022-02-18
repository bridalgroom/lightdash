import { Colors } from '@blueprintjs/core';
import { Classes, Popover2 } from '@blueprintjs/popover2';
import { fieldId } from 'common';
import React, { FC, useState } from 'react';
import { useAvailableDashboardFilterTargets } from '../../../hooks/dashboard/useDashboard';
import { useDashboardContext } from '../../../providers/DashboardProvider';
import FilterConfiguration from '../FilterConfiguration';
import ActiveFilter from './ActiveFilter';
import { TagsWrapper } from './ActiveFilters.styles';

const ActiveFilters: FC = () => {
    const [openedFilter, setOpenedFilter] = useState<string>();
    const {
        dashboard,
        dashboardFilters,
        updateDimensionDashboardFilter,
        removeDimensionDashboardFilter,
    } = useDashboardContext();
    const { isLoading, data: filterableFields } =
        useAvailableDashboardFilterTargets(dashboard);

    return (
        <TagsWrapper>
            {dashboardFilters.dimensions.map((item, index) => {
                const activeField = filterableFields.find(
                    (field) => fieldId(field) === item.target.fieldId,
                );
                if (!activeField) {
                    return (
                        <span style={{ width: '100%', color: Colors.GRAY1 }}>
                            Tried to reference field with unknown id:{' '}
                            {item.target.fieldId}
                        </span>
                    );
                }
                return (
                    <Popover2
                        key={item.id}
                        content={
                            <FilterConfiguration
                                field={activeField}
                                filterRule={item}
                                onSave={(value) => {
                                    setOpenedFilter(undefined);
                                    updateDimensionDashboardFilter(
                                        value,
                                        index,
                                    );
                                }}
                                onBack={() => setOpenedFilter(undefined)}
                            />
                        }
                        interactionKind="click"
                        popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
                        isOpen={openedFilter === item.id}
                        position="bottom"
                        lazy={false}
                        disabled={isLoading}
                    >
                        <ActiveFilter
                            key={item.id}
                            field={activeField}
                            filterRule={item}
                            onRemove={() => {
                                removeDimensionDashboardFilter(index);
                            }}
                            onClick={() => setOpenedFilter(item.id)}
                        />
                    </Popover2>
                );
            })}
        </TagsWrapper>
    );
};

export default ActiveFilters;
