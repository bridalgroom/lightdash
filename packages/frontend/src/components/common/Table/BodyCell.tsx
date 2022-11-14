import { Position } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import { ResultRow } from '@lightdash/common';
import { Cell } from '@tanstack/react-table';
import React, { FC, useCallback, useState } from 'react';
import { CSSProperties } from 'styled-components';
import RichBodyCell from './ScrollableTable/RichBodyCell';
import { Td } from './Table.styles';
import { CellContextMenuProps } from './types';

interface CommonBodyCellProps {
    cell: Cell<ResultRow, unknown>;
    rowIndex: number;
    isNumericItem: boolean;
    hasData: boolean;
    cellContextMenu?: FC<CellContextMenuProps>;
    onSelect?: (cellId: string | undefined) => void;
    className?: string;
    style?: CSSProperties;
}

interface BodyCellProps extends CommonBodyCellProps {
    isSelected: boolean;
    hasContextMenu: boolean;
}

const BodyCell = React.forwardRef<HTMLTableCellElement, BodyCellProps>(
    (
        {
            rowIndex,
            cell,
            hasData,
            hasContextMenu,
            isNumericItem,
            isSelected,
            children,
            onSelect,
            className,
            style,
        },
        ref,
    ) => {
        return (
            <Td
                style={style}
                className={className}
                ref={ref}
                $rowIndex={rowIndex}
                $isSelected={isSelected}
                $isInteractive={hasContextMenu}
                $hasData={hasData}
                $isNaN={!hasData || !isNumericItem}
                onClick={() => onSelect?.(isSelected ? undefined : cell.id)}
            >
                <RichBodyCell cell={cell as Cell<ResultRow, ResultRow[0]>}>
                    {children}
                </RichBodyCell>
            </Td>
        );
    },
);

const BodyCellWrapper: FC<CommonBodyCellProps> = ({ onSelect, ...props }) => {
    const CellContextMenu = props.cellContextMenu;

    const [isCellSelected, setIsCellSelected] = useState<boolean>(false);

    const canHaveContextMenu = !!CellContextMenu && props.hasData;

    const handleCellSelect = useCallback(
        (cellId: string | undefined) => {
            if (!canHaveContextMenu) return;

            onSelect?.(cellId);
            setIsCellSelected(cellId ? true : false);
        },
        [onSelect, setIsCellSelected, canHaveContextMenu],
    );

    console.log(isCellSelected);

    return (
        <Popover2
            isOpen={isCellSelected}
            minimal
            position={Position.BOTTOM_RIGHT}
            hasBackdrop
            backdropProps={{
                onClick: () => handleCellSelect(undefined),
                style: { zIndex: 20 },
            }}
            onOpening={() => handleCellSelect(props.cell.id)}
            onClosing={() => handleCellSelect(undefined)}
            content={
                CellContextMenu && (
                    <CellContextMenu
                        cell={props.cell as Cell<ResultRow, ResultRow[0]>}
                    />
                )
            }
            renderTarget={({ ref }) => (
                <BodyCell
                    {...props}
                    style={
                        isCellSelected
                            ? { position: 'relative', zIndex: 21 }
                            : undefined
                    }
                    hasContextMenu={canHaveContextMenu}
                    isSelected={isCellSelected}
                    onSelect={handleCellSelect}
                    ref={ref}
                />
            )}
        />
    );
};

export default BodyCellWrapper;
