import {
    ConditionalFormattingConfig,
    Field,
    fieldId,
    formatItemValue,
    getConditionalFormattingColor,
    getConditionalFormattingConfig,
    getConditionalFormattingDescription,
    isField,
    isNumericItem,
    PivotData,
    ResultValue,
    TableCalculation,
} from '@lightdash/common';
import { BoxProps } from '@mantine/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import last from 'lodash-es/last';
import { readableColor } from 'polished';
import React, { FC, useCallback } from 'react';
import { isSummable } from '../../../hooks/useColumnTotals';
import { getColorFromRange } from '../../../utils/colorUtils';
import { getConditionalRuleLabel } from '../Filters/configs';
import Table from '../LightTable';
import ValueCellMenu from './ValueCellMenu';

const ROW_HEIGHT_PX = 34;

// const VirtualizedArea: FC<{
//     cellCount: number;
//     height: number;
// }> = ({ cellCount, height }) => {
//     return (
//         <Table.Row>
//             {[...Array(cellCount)].map((_, index) => (
//                 <Table.Cell key={index} h={height} />
//             ))}
//         </Table.Row>
//     );
// };

type PivotTableProps = BoxProps & // TODO: remove this
    React.RefAttributes<HTMLTableElement> & {
        data: PivotData;
        conditionalFormattings: ConditionalFormattingConfig[];
        hideRowNumbers: boolean;
        getFieldLabel: (fieldId: string) => string | undefined;
        getField: (fieldId: string) => Field | TableCalculation;
    };

const PivotTable: FC<PivotTableProps> = ({
    data,
    conditionalFormattings,
    hideRowNumbers = false,
    getFieldLabel,
    getField,
    className,
    ...tableProps
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const getItemFromAxis = useCallback(
        (rowIndex: number, colIndex: number) => {
            const value = data.pivotConfig.metricsAsRows
                ? last(data.indexValues[rowIndex])
                : last(data.headerValues)?.[colIndex];

            if (!value || !value.fieldId) throw new Error('Invalid pivot data');

            return getField(value.fieldId);
        },
        [
            data.pivotConfig.metricsAsRows,
            data.headerValues,
            data.indexValues,
            getField,
        ],
    );

    const getRowTotalValueFromAxis = useCallback(
        (total: unknown, colIndex: number): ResultValue => {
            const value = last(data.rowTotalFields)?.[colIndex];

            if (!value || !value.fieldId) throw new Error('Invalid pivot data');
            const item = getField(value.fieldId);

            const formattedValue = formatItemValue(item, total);

            return {
                raw: total,
                formatted: formattedValue,
            };
        },
        [data.rowTotalFields, getField],
    );

    const getMetricAsRowTotalValueFromAxis = useCallback(
        (total: unknown, rowIndex: number): ResultValue | null => {
            const value = last(data.indexValues[rowIndex]);
            if (!value || !value.fieldId) throw new Error('Invalid pivot data');

            const item = getField(value.fieldId);
            if (!isSummable(item)) {
                return null;
            }
            const formattedValue = formatItemValue(item, total);

            return {
                raw: total,
                formatted: formattedValue,
            };
        },
        [data.indexValues, getField],
    );

    const getColumnTotalValueFromAxis = useCallback(
        (total: unknown, colIndex: number): ResultValue | null => {
            const value = last(data.headerValues)?.[colIndex];
            if (!value || !value.fieldId) throw new Error('Invalid pivot data');

            const item = getField(value.fieldId);
            if (!isSummable(item)) {
                return null;
            }
            const formattedValue = formatItemValue(item, total);

            return {
                raw: total,
                formatted: formattedValue,
            };
        },
        [data.headerValues, getField],
    );

    const getMetricAsRowColumnTotalValueFromAxis = useCallback(
        (total: unknown, rowIndex: number): ResultValue => {
            const value = last(data.columnTotalFields?.[rowIndex]);
            if (!value || !value.fieldId) throw new Error('Invalid pivot data');

            const item = getField(value.fieldId);

            const formattedValue = formatItemValue(item, total);

            return {
                raw: total,
                formatted: formattedValue,
            };
        },
        [data.columnTotalFields, getField],
    );

    const getUnderlyingFieldValues = useCallback(
        (rowIndex: number, colIndex: number) => {
            const item = getItemFromAxis(rowIndex, colIndex);
            const itemValue = data.dataValues[rowIndex][colIndex];

            const initialData =
                isField(item) && itemValue
                    ? { [fieldId(item)]: itemValue }
                    : {};

            return [
                // get the index values for this row
                ...(data.indexValues[rowIndex] ?? []),
                // get the header values for this column
                ...(data.headerValues.map((hv) => hv[colIndex]) ?? []),
            ].reduce<Record<string, ResultValue>>((acc, iv) => {
                if (iv.type !== 'value') return acc;
                return { ...acc, [iv.fieldId]: iv.value };
            }, initialData);
        },
        [data.indexValues, data.headerValues, data.dataValues, getItemFromAxis],
    );

    const hasColumnTotals = data.pivotConfig.columnTotals;

    const hasRowTotals = data.pivotConfig.rowTotals;

    const rowVirtualizer = useVirtualizer({
        getScrollElement: () => containerRef.current,
        count: data.dataValues.length,
        estimateSize: () => ROW_HEIGHT_PX,
        overscan: 25,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    return (
        <Table miw="100%" className={className} {...tableProps}>
            <Table.Head withSticky>
                {data.headerValues.map((headerValues, headerRowIndex) => (
                    <Table.Row
                        key={`header-row-${headerRowIndex}`}
                        index={headerRowIndex}
                    >
                        {/* shows empty cell if row numbers are visible */}
                        {hideRowNumbers ? null : (
                            <Table.Cell withMinimalWidth />
                        )}

                        {/* renders the title labels */}
                        {data.titleFields[headerRowIndex].map(
                            (titleField, titleFieldIndex) => {
                                const field = titleField?.fieldId
                                    ? getField(titleField?.fieldId)
                                    : undefined;

                                const isEmpty = !titleField?.fieldId;

                                const isHeaderTitle =
                                    titleField?.direction === 'header';

                                return isEmpty ? (
                                    <Table.Cell
                                        key={`title-${headerRowIndex}-${titleFieldIndex}`}
                                        withMinimalWidth
                                    />
                                ) : (
                                    <Table.CellHead
                                        key={`title-${headerRowIndex}-${titleFieldIndex}`}
                                        withAlignRight={isHeaderTitle}
                                        withMinimalWidth
                                        withBoldFont
                                        withTooltip={
                                            isField(field)
                                                ? field.description
                                                : undefined
                                        }
                                    >
                                        {titleField?.fieldId
                                            ? getFieldLabel(titleField?.fieldId)
                                            : undefined}
                                    </Table.CellHead>
                                );
                            },
                        )}

                        {/* renders the header values or labels */}
                        {headerValues.map((headerValue, headerColIndex) => {
                            const isLabel = headerValue.type === 'label';
                            const field = getField(headerValue.fieldId);

                            const description =
                                isLabel && isField(field)
                                    ? field.description
                                    : undefined;

                            return isLabel || headerValue.colSpan > 0 ? (
                                <Table.CellHead
                                    key={`header-${headerRowIndex}-${headerColIndex}`}
                                    withBoldFont={isLabel}
                                    withTooltip={description}
                                    colSpan={
                                        isLabel
                                            ? undefined
                                            : headerValue.colSpan
                                    }
                                >
                                    {isLabel
                                        ? getFieldLabel(headerValue.fieldId)
                                        : headerValue.value.formatted}
                                </Table.CellHead>
                            ) : null;
                        })}

                        {/* render the total label */}
                        {hasRowTotals
                            ? data.rowTotalFields?.[headerRowIndex].map(
                                  (totalLabel, headerColIndex) =>
                                      totalLabel ? (
                                          <Table.CellHead
                                              key={`header-total-${headerRowIndex}-${headerColIndex}`}
                                              withBoldFont
                                              withMinimalWidth
                                          >
                                              {totalLabel.fieldId
                                                  ? `Total ${getFieldLabel(
                                                        totalLabel.fieldId,
                                                    )}`
                                                  : `Total`}
                                          </Table.CellHead>
                                      ) : (
                                          <Table.Cell
                                              key={`header-total-${headerRowIndex}-${headerColIndex}`}
                                              withMinimalWidth
                                          />
                                      ),
                              )
                            : null}
                    </Table.Row>
                ))}
            </Table.Head>

            <Table.Body>
                {virtualRows.map((virtualRow) => {
                    const rowIndex = virtualRow.index;
                    const row = data.dataValues[rowIndex];

                    return (
                        <Table.Row key={`row-${rowIndex}`} index={rowIndex}>
                            {!hideRowNumbers && (
                                <Table.Cell withAlignRight>
                                    {rowIndex + 1}
                                </Table.Cell>
                            )}

                            {/* renders empty rows if there are no index values but titles */}
                            {data.indexValueTypes.length === 0 &&
                                data.titleFields[0].map(
                                    (_titleField, titleFieldIndex) => (
                                        <Table.Cell
                                            key={`empty-title-${rowIndex}-${titleFieldIndex}`}
                                        />
                                    ),
                                )}

                            {/* renders the index values or labels */}
                            {data.indexValueTypes.map(
                                (_indexValueType, indexColIndex) => {
                                    const indexValue =
                                        data.indexValues[rowIndex][
                                            indexColIndex
                                        ];
                                    const field = getField(indexValue.fieldId);
                                    const isLabel = indexValue.type === 'label';

                                    const description =
                                        isLabel && isField(field)
                                            ? field.description
                                            : undefined;

                                    return (
                                        <Table.CellHead
                                            key={`index-${rowIndex}-${indexColIndex}`}
                                            withBoldFont={isLabel}
                                            withTooltip={description}
                                        >
                                            {isLabel
                                                ? getFieldLabel(
                                                      indexValue.fieldId,
                                                  )
                                                : indexValue.value.formatted}
                                        </Table.CellHead>
                                    );
                                },
                            )}

                            {/* renders the pivot values */}
                            {row.map((value, colIndex) => {
                                const item = getItemFromAxis(
                                    rowIndex,
                                    colIndex,
                                );

                                const conditionalFormatting = (() => {
                                    const conditionalFormattingConfig =
                                        getConditionalFormattingConfig(
                                            item,
                                            value?.raw,
                                            conditionalFormattings,
                                        );

                                    const tooltipContent =
                                        getConditionalFormattingDescription(
                                            item,
                                            conditionalFormattingConfig,
                                            getConditionalRuleLabel,
                                        );

                                    const conditionalFormattingColor =
                                        getConditionalFormattingColor(
                                            item,
                                            value?.raw,
                                            conditionalFormattingConfig,
                                            getColorFromRange,
                                        );

                                    if (!conditionalFormattingColor) {
                                        return undefined;
                                    }

                                    return {
                                        tooltipContent,
                                        color: readableColor(
                                            conditionalFormattingColor,
                                        ),
                                        backgroundColor:
                                            conditionalFormattingColor,
                                    };
                                })();

                                return (
                                    <Table.Cell
                                        key={`value-${rowIndex}-${colIndex}`}
                                        withAlignRight={isNumericItem(item)}
                                        withColor={conditionalFormatting?.color}
                                        withBackground={
                                            conditionalFormatting?.backgroundColor
                                        }
                                        withTooltip={
                                            conditionalFormatting?.tooltipContent
                                        }
                                        withInteractions={!!value?.formatted}
                                        withMenu={(
                                            { isOpen, onClose, onCopy },
                                            render,
                                        ) => (
                                            <ValueCellMenu
                                                opened={isOpen}
                                                rowIndex={rowIndex}
                                                colIndex={colIndex}
                                                item={item}
                                                value={value}
                                                getUnderlyingFieldValues={
                                                    getUnderlyingFieldValues
                                                }
                                                onClose={onClose}
                                                onCopy={onCopy}
                                            >
                                                {render()}
                                            </ValueCellMenu>
                                        )}
                                    >
                                        {value?.formatted}
                                    </Table.Cell>
                                );
                            })}

                            {/* render the total values */}
                            {hasRowTotals
                                ? data.rowTotals?.[rowIndex].map(
                                      (total, colIndex) => {
                                          const value = data.pivotConfig
                                              .metricsAsRows
                                              ? getMetricAsRowTotalValueFromAxis(
                                                    total,
                                                    rowIndex,
                                                )
                                              : getRowTotalValueFromAxis(
                                                    total,
                                                    colIndex,
                                                );

                                          return value ? (
                                              <Table.CellHead
                                                  key={`index-total-${rowIndex}-${colIndex}`}
                                                  withInteractions
                                                  withAlignRight
                                              >
                                                  {value.formatted}
                                              </Table.CellHead>
                                          ) : (
                                              <Table.CellHead
                                                  key={`index-total-${rowIndex}-${colIndex}`}
                                              />
                                          );
                                      },
                                  )
                                : null}
                        </Table.Row>
                    );
                })}
            </Table.Body>

            {hasColumnTotals ? (
                <Table.Footer withSticky>
                    {data.columnTotals?.map((row, totalRowIndex) => (
                        <Table.Row
                            key={`column-total-${totalRowIndex}`}
                            index={totalRowIndex}
                        >
                            {/* shows empty cell if row numbers are visible */}
                            {hideRowNumbers ? null : <Table.Cell />}

                            {/* render the total label */}
                            {data.columnTotalFields?.[totalRowIndex].map(
                                (totalLabel, totalColIndex) =>
                                    totalLabel ? (
                                        <Table.CellHead
                                            key={`footer-total-${totalRowIndex}-${totalColIndex}`}
                                            withAlignRight
                                            withBoldFont
                                        >
                                            {totalLabel.fieldId
                                                ? `Total ${getFieldLabel(
                                                      totalLabel.fieldId,
                                                  )}`
                                                : `Total`}
                                        </Table.CellHead>
                                    ) : (
                                        <Table.CellHead
                                            key={`footer-total-${totalRowIndex}-${totalColIndex}`}
                                        />
                                    ),
                            )}

                            {row.map((total, totalColIndex) => {
                                const value = data.pivotConfig.metricsAsRows
                                    ? getMetricAsRowColumnTotalValueFromAxis(
                                          total,
                                          totalRowIndex,
                                      )
                                    : getColumnTotalValueFromAxis(
                                          total,
                                          totalColIndex,
                                      );
                                return value ? (
                                    <Table.CellHead
                                        key={`column-total-${totalRowIndex}-${totalColIndex}`}
                                        withInteractions
                                        withAlignRight
                                        withBoldFont
                                    >
                                        {value.formatted}
                                    </Table.CellHead>
                                ) : (
                                    <Table.Cell
                                        key={`footer-total-${totalRowIndex}-${totalColIndex}`}
                                    />
                                );
                            })}

                            {hasRowTotals
                                ? data.rowTotalFields?.[0].map((_, index) => (
                                      <Table.Cell
                                          key={`footer-empty-${totalRowIndex}-${index}`}
                                      />
                                  ))
                                : null}
                        </Table.Row>
                    ))}
                </Table.Footer>
            ) : null}
        </Table>
    );
};

export default PivotTable;
