import moment, { MomentInput } from 'moment';
import {
    CompactConfigMap,
    CompactOrAlias,
    DimensionType,
    Field,
    findCompactConfig,
    isDimension,
    isField,
    isTableCalculation,
    MetricType,
    NumberSeparator,
    TableCalculation,
    TableCalculationFormat,
    TableCalculationFormatType,
} from '../types/field';
import { AdditionalMetric, isAdditionalMetric } from '../types/metricQuery';
import { TimeFrames } from '../types/timeFrames';
import assertUnreachable from './assertUnreachable';

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

export const isMomentInput = (value: unknown): value is MomentInput =>
    typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Date ||
    value instanceof moment;

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
    if (typeof value === 'boolean' || value === '' || value === null)
        return true;

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
        compact?: CompactOrAlias;
    },
): string {
    const { format, round, compact } = options || {};

    const invalidRound = round === undefined || round < 0;
    if (invalidRound && !format) {
        return compact && !Number.isInteger(value)
            ? `${value}`
            : new Intl.NumberFormat('en-US').format(Number(value));
    }
    const isValidFormat =
        !!format &&
        format !== 'km' &&
        format !== 'mi' &&
        format !== 'percent' &&
        format !== 'id';

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
        compact?: CompactOrAlias;
    },
): string {
    const { format, round, compact } = options || {};
    if (compact) {
        const compactRound =
            compact && round === undefined && format === undefined ? 2 : round;
        const compactConfig = findCompactConfig(compact);
        if (compactConfig) {
            return `${roundNumber(compactConfig.convertFn(Number(value)), {
                format,
                round: compactRound,
                compact,
            })}${compactConfig.suffix}`;
        }
    }
    return `${new Intl.NumberFormat('en-US').format(Number(value))}`;
}

export function formatValue(
    value: unknown,
    options?: {
        format?: string;
        round?: number;
        compact?: CompactOrAlias;
    },
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';
    if (!isNumber(value)) {
        return `${value}`;
    }
    const { format, round, compact } = options || {};

    const styledValue = compact
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
        case 'id':
            return `${value}`;
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
        case MetricType.PERCENTILE:
        case MetricType.MEDIAN:
        case MetricType.AVERAGE:
        case MetricType.COUNT:
        case MetricType.COUNT_DISTINCT:
        case MetricType.SUM:
            return formatValue(value, { format, round, compact });
        case DimensionType.BOOLEAN:
        case MetricType.BOOLEAN:
            return formatBoolean(value);
        case DimensionType.DATE:
        case MetricType.DATE:
            return isMomentInput(value)
                ? formatDate(
                      value,
                      isDimension(field) ? field.timeInterval : undefined,
                      convertToUTC,
                  )
                : 'NaT';
        case DimensionType.TIMESTAMP:
            return isMomentInput(value)
                ? formatTimestamp(
                      value,
                      isDimension(field) ? field.timeInterval : undefined,
                      convertToUTC,
                  )
                : 'NaT';
        case MetricType.MAX:
        case MetricType.MIN: {
            if (value instanceof Date) {
                return formatTimestamp(
                    value,
                    isDimension(field) ? field.timeInterval : undefined,
                    convertToUTC,
                );
            }
            return formatValue(value, { format, round, compact });
        }
        default: {
            return `${value}`;
        }
    }
}

export const currencies = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CHF',
    'CAD',
    'AUD',
    'CNY',
    'ARS',
    'BRL',
    'CLP',
    'COP',
    'CZK',
    'DKK',
    'HKD',
    'HUF',
    'INR',
    'ILS',
    'KRW',
    'MYR',
    'MXN',
    'MAD',
    'NZD',
    'NOK',
    'PHP',
    'PLN',
    'RUB',
    'SAR',
    'SGD',
    'ZAR',
    'SEK',
    'TWD',
    'THB',
    'TRY',
    'VND',
];

export function formatTableCalculationNumber(
    value: number,
    format: TableCalculationFormat,
): string {
    const getFormatOptions = () => {
        const currencyOptions =
            format.type === TableCalculationFormatType.CURRENCY &&
            format.currency !== undefined
                ? { style: 'currency', currency: format.currency }
                : {};

        if (
            format.round === undefined &&
            format.type === TableCalculationFormatType.CURRENCY &&
            format.currency !== undefined
        ) {
            // We apply the default round and separator from the currency
            return currencyOptions;
        }
        const round = format.round || 0;
        return round <= 0
            ? {
                  maximumSignificantDigits: Math.max(
                      Math.floor(value).toString().length + round,
                      1,
                  ),
                  maximumFractionDigits: 0,
                  ...currencyOptions,
              }
            : {
                  maximumFractionDigits: Math.min(round, 20),
                  minimumFractionDigits: Math.min(round, 20),
                  ...currencyOptions,
              };
    };

    const options = getFormatOptions();
    const separator = format.separator || NumberSeparator.DEFAULT;
    switch (separator) {
        case NumberSeparator.COMMA_PERIOD:
            return value.toLocaleString('en-US', options);
        case NumberSeparator.SPACE_PERIOD:
            return value.toLocaleString('en-US', options).replace(/,/g, ' ');
        case NumberSeparator.PERIOD_COMMA:
            // If currency is provided, having a PERIOD_COMMA separator will also change the position of the currency symbol
            return value.toLocaleString('de-DE', options);
        case NumberSeparator.NO_SEPARATOR_PERIOD:
            return value.toLocaleString('en-US', {
                ...options,
                useGrouping: false,
            });
        case NumberSeparator.DEFAULT:
            // This will apply the default style for each currency
            return value.toLocaleString(undefined, options);
        default:
            return assertUnreachable(separator, 'Unknown separator');
    }
}

export function formatTableCalculationValue(
    field: TableCalculation,
    value: unknown,
): string {
    if (field.format?.type === undefined) return formatValue(value);

    const applyCompact = (): { compactValue: any; compactSuffix: string } => {
        if (field.format?.compact === undefined)
            return { compactValue: value, compactSuffix: '' };
        const compactValue = CompactConfigMap[field.format.compact].convertFn(
            Number(value),
        );
        const compactSuffix = field.format.compact
            ? CompactConfigMap[field.format.compact].suffix
            : '';

        return { compactValue, compactSuffix };
    };
    const { compactValue, compactSuffix } = applyCompact();
    if (valueIsNaN(value)) {
        return formatValue(value);
    }
    switch (field.format.type) {
        case TableCalculationFormatType.DEFAULT:
            return formatValue(value);

        case TableCalculationFormatType.PERCENT:
            const formatted = formatTableCalculationNumber(
                Number(value) * 100,
                field.format,
            );
            return `${formatted}%`;
        case TableCalculationFormatType.CURRENCY:
            const currencyFormatted = formatTableCalculationNumber(
                compactValue,
                field.format,
            ).replace(/\u00A0/, ' ');

            return `${currencyFormatted}${compactSuffix}`;
        case TableCalculationFormatType.NUMBER:
            const prefix = field.format.prefix || '';
            const suffix = field.format.suffix || '';

            const numberFormatted = formatTableCalculationNumber(
                compactValue,
                field.format,
            );

            return `${prefix}${numberFormatted}${compactSuffix}${suffix}`;
        default:
            return assertUnreachable(
                field.format.type,
                `Table calculation format type ${field.format.type} is not valid`,
            );
    }
}

export function formatItemValue(
    item: Field | AdditionalMetric | TableCalculation | undefined,
    value: unknown,
    convertToUTC?: boolean,
): string {
    if (value === null) return '∅';
    if (value === undefined) return '-';

    if (isField(item) || isAdditionalMetric(item)) {
        return formatFieldValue(item, value, convertToUTC);
    }
    if (item !== undefined && isTableCalculation(item)) {
        return formatTableCalculationValue(item, value);
    }
    return formatValue(value);
}
