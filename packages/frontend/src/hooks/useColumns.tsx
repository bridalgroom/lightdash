import { Icon } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import {
    AdditionalMetric,
    Field,
    formatItemValue,
    friendlyName,
    getItemMap,
    isAdditionalMetric,
    isDimension,
    isField,
    isNumericItem,
    TableCalculation,
} from '@lightdash/common';
import { useMemo } from 'react';
import {
    TableHeaderBoldLabel,
    TableHeaderLabelContainer,
    TableHeaderRegularLabel,
} from '../components/common/Table/Table.styles';
import { TableColumn } from '../components/common/Table/types';
import { useExplorer } from '../providers/ExplorerProvider';
import useColumnTotals from './useColumnTotals';
import { useExplore } from './useExplore';

export const getItemBgColor = (
    item: Field | AdditionalMetric | TableCalculation,
): string => {
    let bgColor: string;

    if (isField(item) || isAdditionalMetric(item)) {
        bgColor = isDimension(item) ? '#d2dbe9' : '#e4dad0';
    } else {
        bgColor = '#d2dfd7';
    }
    return bgColor;
};

export const useColumns = (): TableColumn[] => {
    const {
        state: {
            activeFields,
            unsavedChartVersion: {
                tableName,
                metricQuery: { tableCalculations, additionalMetrics, sorts },
            },
        },
        queryResults: { data: resultsData },
        actions: { toggleSortField, setSortFields },
    } = useExplorer();
    const { data: exploreData } = useExplore(tableName);

    const { activeItemsMap, invalidActiveItems } = useMemo<{
        activeItemsMap: Record<string, Field | TableCalculation>;
        invalidActiveItems: string[];
    }>(() => {
        if (exploreData) {
            const allItemsMap = getItemMap(
                exploreData,
                additionalMetrics,
                tableCalculations,
            );
            return Array.from(activeFields).reduce<{
                activeItemsMap: Record<string, Field | TableCalculation>;
                invalidActiveItems: string[];
            }>(
                (acc, key) => {
                    return allItemsMap[key]
                        ? {
                              ...acc,
                              activeItemsMap: {
                                  ...acc.activeItemsMap,
                                  [key]: allItemsMap[key],
                              },
                          }
                        : {
                              ...acc,
                              invalidActiveItems: [
                                  ...acc.invalidActiveItems,
                                  key,
                              ],
                          };
                },
                { activeItemsMap: {}, invalidActiveItems: [] },
            );
        }
        return { activeItemsMap: {}, invalidActiveItems: [] };
    }, [additionalMetrics, exploreData, tableCalculations, activeFields]);

    const totals = useColumnTotals({
        resultsData,
        itemsMap: activeItemsMap,
    });

    return useMemo(() => {
        const validColumns = Object.entries(activeItemsMap).reduce<
            TableColumn[]
        >((acc, [fieldId, item]) => {
            const hasJoins = (exploreData?.joinedTables || []).length > 0;

            const sortIndex = sorts.findIndex((sf) => fieldId === sf.fieldId);
            const isFieldSorted = sortIndex !== -1;
            const column: TableColumn = {
                id: fieldId,
                header: () => (
                    <TableHeaderLabelContainer>
                        {isField(item) ? (
                            <>
                                {hasJoins && (
                                    <TableHeaderRegularLabel>
                                        {item.tableLabel} -{' '}
                                    </TableHeaderRegularLabel>
                                )}

                                <TableHeaderBoldLabel>
                                    {item.label}
                                </TableHeaderBoldLabel>
                            </>
                        ) : (
                            <TableHeaderBoldLabel>
                                {item.displayName || friendlyName(item.name)}
                            </TableHeaderBoldLabel>
                        )}
                    </TableHeaderLabelContainer>
                ),
                accessorKey: fieldId,
                cell: (info) => info.getValue()?.value.formatted || '-',
                footer: () =>
                    totals[fieldId]
                        ? formatItemValue(item, totals[fieldId])
                        : null,
                meta: {
                    item,
                    draggable: true,
                    bgColor: getItemBgColor(item),
                    sort: isFieldSorted
                        ? {
                              sortIndex,
                              sort: sorts[sortIndex],
                              isMultiSort: sorts.length > 1,
                              isNumeric: isNumericItem(item),
                          }
                        : undefined,
                    onHeaderClick: (e) => {
                        if (e.metaKey || e.ctrlKey || isFieldSorted) {
                            toggleSortField(fieldId);
                        } else {
                            setSortFields([
                                {
                                    fieldId,
                                    descending: isFieldSorted
                                        ? !sorts[sortIndex].descending
                                        : false,
                                },
                            ]);
                        }
                    },
                },
            };
            return [...acc, column];
        }, []);
        const invalidColumns = invalidActiveItems.reduce<TableColumn[]>(
            (acc, fieldId) => {
                const column: TableColumn = {
                    id: fieldId,
                    header: () => (
                        <span>
                            <Tooltip2
                                content="This field was not found in the dbt project."
                                position={'top'}
                            >
                                <Icon
                                    icon={'warning-sign'}
                                    intent="warning"
                                    style={{ marginRight: 10 }}
                                />
                            </Tooltip2>
                            <b>{fieldId}</b>
                        </span>
                    ),
                    accessorKey: fieldId,
                    cell: (info) => info.getValue()?.value.formatted || '-',
                    meta: {
                        isInvalidItem: true,
                    },
                };
                return [...acc, column];
            },
            [],
        );
        return [...validColumns, ...invalidColumns];
    }, [
        activeItemsMap,
        invalidActiveItems,
        sorts,
        totals,
        exploreData,
        toggleSortField,
        setSortFields,
    ]);
};
