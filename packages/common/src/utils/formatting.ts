import moment from 'moment';
import {
    DimensionType,
    Field,
    isDimension,
    isField,
    MetricType,
} from '../types/field';
import { AdditionalMetric, TableCalculation } from '../types/metricQuery';
import { NumberStyle } from '../types/savedCharts';

const formatBoolean = <T>(v: T) =>
    ['True', 'true', 'yes', 'Yes', '1', 'T'].includes(`${v}`) ? 'Yes' : 'No';

function formatDate<T = string | Date>(
    date: T,
    timeInterval: string | undefined = 'DAY',
): string {
    let dateForm: string;
    switch (timeInterval.toUpperCase()) {
        case 'YEAR':
            dateForm = 'YYYY';
            break;
        case 'MONTH':
            dateForm = 'YYYY-MM';
            break;
        default:
            dateForm = 'YYYY-MM-DD';
            break;
    }
    return moment(date).format(dateForm);
}

function formatTimestamp<T = string | Date>(
    value: T,
    timeInterval: string | undefined = 'MILLISECOND',
): string {
    let timeFormat: string;
    switch (timeInterval.toUpperCase()) {
        case 'HOUR':
            timeFormat = 'HH';
            break;
        case 'MINUTE':
            timeFormat = 'HH:mm';
            break;
        case 'SECOND':
            timeFormat = 'HH:mm:ss';
            break;
        default:
            timeFormat = 'HH:mm:ss:SSS';
            break;
    }

    return moment(value).format(`YYYY-MM-DD, ${timeFormat} (Z)`);
}

function valueIsNaN(value: any) {
    if (typeof value === 'boolean') return true;
    return Number.isNaN(Number(value));
}

function roundNumber(value: any, round: number | undefined): string {
    if (round === undefined || round < 0) {
        return `${value}`;
    }
    if (valueIsNaN(value)) {
        return `${value}`;
    }
    return Number(value).toFixed(round);
}

function styleNumber(
    value: any,
    numberStyle: NumberStyle | undefined,
    round: number | undefined,
): string {
    if (valueIsNaN(value)) {
        return `${value}`;
    }
    switch (numberStyle) {
        case NumberStyle.THOUSANDS:
            return `${roundNumber(Number(value) / 1000, round)}K`;
        case NumberStyle.MILLIONS:
            return `${roundNumber(Number(value) / 1000000, round)}M`;
        case NumberStyle.BILLIONS:
            return `${roundNumber(Number(value) / 1000000000, round)}B`;
        default:
            return `${value}`;
    }
}

export function formatValue(
    format: string | undefined,
    round: number | undefined,
    value: any,
    numberStyle?: NumberStyle, // for bigNumbers
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';

    const styledValue = numberStyle
        ? styleNumber(value, numberStyle, round)
        : roundNumber(value, round);
    switch (format) {
        case 'km':
        case 'mi':
            return `${styledValue} ${format}`;
        case 'usd':
            return `$${styledValue}`;
        case 'gbp':
            return `£${styledValue}`;
        case 'eur':
            return `€${styledValue}`;
        case 'percent':
            if (valueIsNaN(value)) {
                return `${value}`;
            }

            // Fix rounding issue
            return `${(Number(value) * 100).toFixed(round)}%`;

        case '': // no format
            return styledValue;
        default:
            // unrecognized format
            return styledValue;
    }
}

export function formatFieldValue(
    field: Field | AdditionalMetric | undefined,
    value: any,
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';
    if (!field) {
        return `${value}`;
    }
    const { type, round, format } = field;
    switch (type) {
        case DimensionType.STRING:
        case MetricType.STRING:
        case DimensionType.NUMBER:
        case MetricType.NUMBER:
        case MetricType.AVERAGE:
        case MetricType.COUNT:
        case MetricType.COUNT_DISTINCT:
        case MetricType.SUM:
        case MetricType.MIN:
        case MetricType.MAX:
            return formatValue(format, round, value);
        case DimensionType.BOOLEAN:
        case MetricType.BOOLEAN:
            return formatBoolean(value);
        case DimensionType.DATE:
        case MetricType.DATE:
            return formatDate(
                value,
                isDimension(field) ? field.timeInterval : undefined,
            );
        case DimensionType.TIMESTAMP:
            return formatTimestamp(
                value,
                isDimension(field) ? field.timeInterval : undefined,
            );
        default: {
            return `${value}`;
        }
    }
}

export function formatItemValue(
    item: Field | TableCalculation | undefined,
    value: any,
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';
    return isField(item) ? formatFieldValue(item, value) : `${value}`;
}
