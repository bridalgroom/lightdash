import { Colors } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { isField } from '@lightdash/common';
import { flexRender } from '@tanstack/react-table';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useTableContext } from '../TableProvider';
import { TableColumn } from '../types';
import { HeaderDndContext, HeaderDroppable } from './HeaderDnD';
import SortIndicator from './SortIndicator';

const TableHeader = () => {
    const { table, headerButton, headerContextMenu } = useTableContext();
    const HeaderContextMenu = headerContextMenu || React.Fragment;
    const HeaderButton = headerButton || React.Fragment;
    const currentColOrder = React.useRef<Array<string>>([]);
    return (
        <>
            {table.getHeaderGroups().map((headerGroup) => (
                <colgroup key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef
                            .meta as TableColumn['meta'];
                        return (
                            <col
                                style={{
                                    backgroundColor:
                                        meta?.bgColor ?? Colors.WHITE,
                                }}
                            />
                        );
                    })}
                </colgroup>
            ))}
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <HeaderDndContext colOrderRef={currentColOrder}>
                        <HeaderDroppable headerGroup={headerGroup}>
                            {headerGroup.headers.map((header) => {
                                const meta = header.column.columnDef
                                    .meta as TableColumn['meta'];
                                return (
                                    <th
                                        colSpan={header.colSpan}
                                        style={{
                                            width: meta?.width,
                                            backgroundColor:
                                                meta?.bgColor ?? Colors.WHITE,
                                            cursor: meta?.onHeaderClick
                                                ? 'pointer'
                                                : undefined,
                                        }}
                                        onClick={meta?.onHeaderClick}
                                    >
                                        <Tooltip2
                                            fill
                                            content={
                                                meta?.item &&
                                                isField(meta?.item)
                                                    ? meta.item.description
                                                    : undefined
                                            }
                                            position="top"
                                        >
                                            <Draggable
                                                key={header.id}
                                                draggableId={header.id}
                                                index={header.index}
                                                isDragDisabled={
                                                    !meta?.draggable
                                                }
                                            >
                                                {(provided, snapshot) => (
                                                    <HeaderContextMenu
                                                        header={header}
                                                    >
                                                        <div
                                                            ref={
                                                                provided.innerRef
                                                            }
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided
                                                                    .draggableProps
                                                                    .style,
                                                                ...(!snapshot.isDragging && {
                                                                    transform:
                                                                        'translate(0,0)',
                                                                }),
                                                                ...(snapshot.isDropAnimating && {
                                                                    transitionDuration:
                                                                        '0.001s',
                                                                }),
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'space-between',
                                                            }}
                                                        >
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                      header
                                                                          .column
                                                                          .columnDef
                                                                          .header,
                                                                      header.getContext(),
                                                                  )}
                                                            {meta?.sort && (
                                                                <SortIndicator
                                                                    {...meta?.sort}
                                                                />
                                                            )}
                                                            <HeaderButton
                                                                header={header}
                                                            />
                                                        </div>
                                                    </HeaderContextMenu>
                                                )}
                                            </Draggable>
                                        </Tooltip2>
                                    </th>
                                );
                            })}
                        </HeaderDroppable>
                    </HeaderDndContext>
                ))}
            </thead>
        </>
    );
};

export default TableHeader;
