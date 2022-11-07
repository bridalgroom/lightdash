import moment, { MomentInput } from 'moment';
import {
    DimensionType,
    Field,
    findNumberStyleConfig,
    isDimension,
    isField,
    MetricType,
    NumberStyleOrAlias,
} from '../types/field';
import {
    AdditionalMetric,
    isAdditionalMetric,
    TableCalculation,
} from '../types/metricQuery';
import { TimeFrames } from '../types/timeFrames';

export const formatBoolean = <T>(v: T) =>
    ['True', 'true', 'yes', 'Yes', '1', 'T'].includes(`${v}`) ? 'Yes' : 'No';

export const getDateFormat = (
    timeInterval: TimeFrames | undefined = TimeFrames.DAY,
): string => {
    let dateForm: string;
    switch (timeInterval) {
        case TimeFrames.YEAR:
            dateForm = 'YYYY';
            break;
        case TimeFrames.QUARTER:
            dateForm = 'YYYY-[Q]Q';
            break;
        case TimeFrames.MONTH:
            dateForm = 'YYYY-MM';
            break;
        default:
            dateForm = 'YYYY-MM-DD';
            break;
    }
    return dateForm;
};

export function formatDate(
    date: MomentInput,
    timeInterval: TimeFrames | undefined = TimeFrames.DAY,
    convertToUTC: boolean = false,
): string {
    const momentDate = convertToUTC ? moment(date).utc() : moment(date);
    return momentDate.format(getDateFormat(timeInterval));
}

export const parseDate = (
    str: string,
    timeInterval: TimeFrames | undefined = TimeFrames.DAY,
): Date => moment(str, getDateFormat(timeInterval)).toDate();

const getTimeFormat = (
    timeInterval: TimeFrames | undefined = TimeFrames.DAY,
): string => {
    let timeFormat: string;
    switch (timeInterval) {
        case TimeFrames.HOUR:
            timeFormat = 'HH';
            break;
        case TimeFrames.MINUTE:
            timeFormat = 'HH:mm';
            break;
        case TimeFrames.SECOND:
            timeFormat = 'HH:mm:ss';
            break;
        default:
            timeFormat = 'HH:mm:ss:SSS';
            break;
    }
    return `YYYY-MM-DD, ${timeFormat} (Z)`;
};

export function formatTimestamp(
    value: MomentInput,
    timeInterval: TimeFrames | undefined = TimeFrames.MILLISECOND,
    convertToUTC: boolean = false,
): string {
    const momentDate = convertToUTC ? moment(value).utc() : moment(value);
    return momentDate.format(getTimeFormat(timeInterval));
}

export const parseTimestamp = (
    str: string,
    timeInterval: TimeFrames | undefined = TimeFrames.MILLISECOND,
): Date => moment(str, getTimeFormat(timeInterval)).toDate();

export function valueIsNaN(value: unknown) {
    if (typeof value === 'boolean') return true;
    return Number.isNaN(Number(value));
}

export function isNumber(value: unknown): value is number {
    return !valueIsNaN(value);
}

function roundNumber(
    value: number,
    options?: {
        format?: string;
        round?: number;
        numberStyle?: NumberStyleOrAlias;
    },
): string {
    const { format, round, numberStyle } = options || {};

    const invalidRound = round === undefined || round < 0;
    if (invalidRound && !format) {
        return numberStyle && !Number.isInteger(value)
            ? `${value}`
            : new Intl.NumberFormat('en-US').format(Number(value));
    }
    const isValidFormat =
        !!format && format !== 'km' && format !== 'mi' && format !== 'percent';

    const validFractionDigits = invalidRound
        ? {}
        : { maximumFractionDigits: round, minimumFractionDigits: round };

    if (isValidFormat) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: format?.toUpperCase(),
            ...validFractionDigits,
        }).format(Number(value));
    }

    return new Intl.NumberFormat('en-US', validFractionDigits).format(
        Number(value),
    );
}

function styleNumber(
    value: number,
    options?: {
        format?: string;
        round?: number;
        numberStyle?: NumberStyleOrAlias;
    },
): string {
    const { format, round, numberStyle } = options || {};
    if (numberStyle) {
        const numberStyleRound =
            numberStyle && round === undefined && format === undefined
                ? 2
                : round;
        const numberStyleConfig = findNumberStyleConfig(numberStyle);
        if (numberStyleConfig) {
            return `${roundNumber(numberStyleConfig.convertFn(Number(value)), {
                format,
                round: numberStyleRound,
                numberStyle,
            })}${numberStyleConfig.suffix}`;
        }
    }
    return `${new Intl.NumberFormat('en-US').format(Number(value))}`;
}

export function formatValue(
    value: unknown,
    options?: {
        format?: string;
        round?: number;
        numberStyle?: NumberStyleOrAlias;
    },
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';
    if (!isNumber(value)) {
        return `${value}`;
    }
    const { format, round, numberStyle } = options || {};

    const styledValue = numberStyle
        ? styleNumber(value, options)
        : roundNumber(value, { round, format });
    switch (format) {
        case 'km':
        case 'mi':
            return `${styledValue} ${format}`;
        case 'usd':
        case 'gbp':
        case 'eur':
            return `${styledValue}`;
        case 'percent':
            if (valueIsNaN(value)) {
                return `${value}`;
            }

            const invalidRound = round === undefined || round < 0;
            const roundBy = invalidRound ? 0 : round;
            // Fix rounding issue
            return `${(Number(value) * 100).toFixed(roundBy)}%`;

        case '': // no format
            return styledValue;
        default:
            // unrecognized format
            return styledValue;
    }
}

export function formatFieldValue(
    field: Field | AdditionalMetric | undefined,
    value: unknown,
    convertToUTC?: boolean,
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';
    if (!field) {
        return `${value}`;
    }
    const { type, round, format, compact } = field;
    switch (type) {
        case DimensionType.STRING:
        case MetricType.STRING:
            return `${value}`;
        case DimensionType.NUMBER:
        case MetricType.NUMBER:
        case MetricType.AVERAGE:
        case MetricType.COUNT:
        case MetricType.COUNT_DISTINCT:
        case MetricType.SUM:
            return formatValue(value, { format, round, numberStyle: compact });
        case DimensionType.BOOLEAN:
        case MetricType.BOOLEAN:
            return formatBoolean(value);
        case DimensionType.DATE:
        case MetricType.DATE:
            return formatDate(
                value,
                isDimension(field) ? field.timeInterval : undefined,
                convertToUTC,
            );
        case DimensionType.TIMESTAMP:
            return formatTimestamp(
                value,
                isDimension(field) ? field.timeInterval : undefined,
                convertToUTC,
            );
        case MetricType.MAX:
        case MetricType.MIN: {
            if (value instanceof Date) {
                return formatTimestamp(
                    value,
                    isDimension(field) ? field.timeInterval : undefined,
                    convertToUTC,
                );
            }
            return formatValue(value, { format, round, numberStyle: compact });
        }
        default: {
            return `${value}`;
        }
    }
}

export function formatItemValue(
    item: Field | AdditionalMetric | TableCalculation | undefined,
    value: unknown,
    convertToUTC?: boolean,
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';
    return isField(item) || isAdditionalMetric(item)
        ? formatFieldValue(item, value, convertToUTC)
        : formatValue(value);
}
