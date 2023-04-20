import { FieldType } from './field';
import { ResultValue } from './results';

export type PivotConfig = {
    pivotDimensions: string[];
    metricsAsRows: boolean;
    columnOrder?: string[];
    hiddenMetricFieldIds?: string[];
};

type HeaderOrIndexType =
    | { type: FieldType.METRIC; fieldId?: undefined }
    | { type: FieldType.DIMENSION; fieldId: string };

export type PivotHeaderType = HeaderOrIndexType;
export type PivotIndexType = HeaderOrIndexType;

export type PivotValue =
    | { type: 'label'; fieldId: string; value?: undefined }
    | { type: 'value'; fieldId: string; value: ResultValue };

export type PivotTitleValue = PivotValue & {
    titleDirection: 'index' | 'header';
};

export type PivotData = {
    titleFields: (PivotTitleValue | null)[][];

    headerValueTypes: PivotHeaderType[];
    headerValues: PivotValue[][];

    indexValueTypes: PivotIndexType[];
    indexValues: PivotValue[][];

    dataColumnCount: number;
    dataValues: (ResultValue | null)[][];

    columnTotals?: (ResultValue | null)[][];
    rowTotals?: (ResultValue | null)[][];

    pivotConfig: PivotConfig;
};
