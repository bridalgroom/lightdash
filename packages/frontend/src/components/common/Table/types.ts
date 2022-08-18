import {
    Field,
    ResultRow,
    SortField,
    TableCalculation,
} from '@lightdash/common';
import { Cell, ColumnDef, Header } from '@tanstack/react-table';
import { MouseEventHandler } from 'react';

export type HeaderProps = { header: Header<ResultRow> };
export type CellContextMenuProps = {
    cell: Cell<ResultRow>;
    onOpen: () => void;
    onClose: () => void;
    boundaryElement: HTMLDivElement | null;
};

export type Sort = {
    sortIndex: number;
    sort: SortField;
    isNumeric: boolean;
    isMultiSort: boolean;
};

export type TableColumn = ColumnDef<ResultRow> & {
    meta?: {
        isInvalidItem?: boolean;
        width?: number;
        draggable?: boolean;
        item?: Field | TableCalculation;
        bgColor?: string;
        sort?: Sort;
        onHeaderClick?: MouseEventHandler<HTMLTableHeaderCellElement>;
    };
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 5000;

export const ROW_NUMBER_COLUMN_ID = 'row_number_column';
