import { ConditionalOperator, ConditionalRule } from './conditionalRule';

export enum FilterType {
    STRING = 'string',
    NUMBER = 'number',
    DATE = 'date',
    BOOLEAN = 'boolean',
}

export enum UnitOfTime {
    milliseconds = 'milliseconds',
    seconds = 'seconds',
    minutes = 'minutes',
    hours = 'hours',
    days = 'days',
    weeks = 'weeks',
    months = 'months',
    quarters = 'quarters',
    years = 'years',
}

export const unitOfTimeFormat: Record<UnitOfTime, string> = {
    milliseconds: 'YYYY-MM-DD HH:mm:ss',
    seconds: 'YYYY-MM-DD HH:mm:ss',
    minutes: 'YYYY-MM-DD HH:mm',
    hours: 'YYYY-MM-DD HH',
    days: 'YYYY-MM-DD',
    weeks: 'YYYY-MM-DD',
    months: 'YYYY-MM',
    quarters: 'YYYY-MM',
    years: 'YYYY',
};

export type FieldTarget = {
    fieldId: string;
};

export interface FilterRule<
    O = ConditionalOperator,
    T = FieldTarget,
    V = any,
    S = any,
> extends ConditionalRule<O, V> {
    id: string;
    target: T;
    settings?: S;
    disabled?: boolean;
}

export interface MetricFilterRule
    extends FilterRule<ConditionalOperator, { fieldRef: string }> {}

export type DashboardFieldTarget = {
    fieldId: string;
    tableName: string;
};

type DashboardTileTarget = DashboardFieldTarget | false;

export type DashboardFilterRule<
    O = ConditionalOperator,
    T extends DashboardFieldTarget = DashboardFieldTarget,
    V = any,
    S = any,
> = FilterRule<O, T, V, S> & {
    tileTargets?: Record<string, DashboardTileTarget>;
    label: undefined | string;
};

export type DateFilterRule = FilterRule<
    ConditionalOperator,
    unknown,
    any,
    {
        unitOfTime?: UnitOfTime;
        completed?: boolean;
    }
>;

export type FilterGroupItem = FilterGroup | FilterRule;

export type OrFilterGroup = {
    id: string;
    or: Array<FilterGroupItem>;
};

export type AndFilterGroup = {
    id: string;
    and: Array<FilterGroupItem>;
};

export type FilterGroup = OrFilterGroup | AndFilterGroup;

export type Filters = {
    // Note: dimensions need to be in a separate filter group from metrics & table calculations
    dimensions?: FilterGroup;
    metrics?: FilterGroup;
};

export type DashboardFilters = {
    dimensions: DashboardFilterRule[];
    metrics: DashboardFilterRule[];
};

export type DashboardFiltersFromSearchParam = {
    dimensions: (Omit<DashboardFilterRule, 'tileTargets'> & {
        tileTargets?: (string | Record<string, DashboardTileTarget>)[];
    })[];
    metrics: (Omit<DashboardFilterRule, 'tileTargets'> & {
        tileTargets?: (string | Record<string, DashboardTileTarget>)[];
    })[];
};

/* Utils */

export const isOrFilterGroup = (
    value: FilterGroupItem,
): value is OrFilterGroup => 'or' in value;

export const isAndFilterGroup = (
    value: FilterGroupItem,
): value is AndFilterGroup => 'and' in value;

export const isFilterGroup = (value: FilterGroupItem): value is FilterGroup =>
    isOrFilterGroup(value) || isAndFilterGroup(value);

export const isFilterRule = (value: ConditionalRule): value is FilterRule =>
    'id' in value && 'target' in value && 'operator' in value;

export const getFilterRules = (filters: Filters): FilterRule[] => {
    const rules: FilterRule[] = [];
    const flattenFilterGroup = (filterGroup: FilterGroup): FilterRule[] => {
        const groupRules: FilterRule[] = [];

        (isAndFilterGroup(filterGroup)
            ? filterGroup.and
            : filterGroup.or
        ).forEach((item) => {
            if (isFilterGroup(item)) {
                rules.push(...flattenFilterGroup(item));
            } else {
                rules.push(item);
            }
        });
        return groupRules;
    };
    if (filters.dimensions) {
        rules.push(...flattenFilterGroup(filters.dimensions));
    }
    if (filters.metrics) {
        rules.push(...flattenFilterGroup(filters.metrics));
    }
    return rules;
};

export const isDashboardFilterRule = (
    value: ConditionalRule,
): value is DashboardFilterRule =>
    isFilterRule(value) && 'tableName' in value.target;

export enum FilterGroupOperator {
    and = 'and',
    or = 'or',
}

const isDashboardTileTargetFilterOverride = (
    filter: string | Record<string, DashboardTileTarget>,
): filter is Record<string, DashboardTileTarget> =>
    typeof filter === 'object' || typeof filter === 'boolean';

export const convertDashboardFiltersParamToDashboardFilters = (
    dashboardFilters: DashboardFiltersFromSearchParam,
): DashboardFilters =>
    Object.entries(dashboardFilters).reduce(
        (result, [key, value]) => ({
            ...result,
            [key]: value.map((f) => ({
                ...f,
                ...(f.tileTargets && {
                    tileTargets: f.tileTargets.reduce<
                        Record<string, DashboardTileTarget>
                    >((tileTargetsResult, tileTarget) => {
                        const targetName = Object.keys(tileTarget)[0];
                        const targetValue = Object.values(tileTarget)[0];
                        if (isDashboardTileTargetFilterOverride(tileTarget)) {
                            return {
                                ...tileTargetsResult,
                                ...{ [targetName]: targetValue },
                            };
                        }
                        return tileTargetsResult;
                    }, {}),
                }),
            })),
        }),
        { dimensions: [], metrics: [] },
    );

export const compressDashboardFiltersToParam = (
    dashboardFilters: DashboardFilters,
): DashboardFiltersFromSearchParam =>
    Object.entries(dashboardFilters).reduce(
        (result, [key, value]) => ({
            ...result,
            [key]: value.map((f) => ({
                ...f,
                ...(f.tileTargets && {
                    tileTargets: Object.entries(f.tileTargets).reduce(
                        (
                            tileTargetsResult: Array<{
                                [tile: string]: DashboardTileTarget;
                            }>,
                            [tileTargetKey, tileTargetValue],
                        ) => {
                            // If the filter is not disabled for this tile
                            // AND the table and field match, we omit it.
                            // The filter will be automatically applied there
                            if (
                                tileTargetValue !== false &&
                                tileTargetValue.fieldId === f.target.fieldId &&
                                tileTargetValue.tableName === f.target.tableName
                            ) {
                                return tileTargetsResult;
                            }

                            return [
                                ...tileTargetsResult,
                                {
                                    [tileTargetKey]: tileTargetValue,
                                },
                            ];
                        },
                        [],
                    ),
                }),
            })),
        }),
        { dimensions: [], metrics: [] },
    );

export { ConditionalOperator as FilterOperator };