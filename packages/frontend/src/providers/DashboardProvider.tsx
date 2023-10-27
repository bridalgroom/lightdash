import {
    ApiError,
    compressDashboardFiltersToParam,
    convertDashboardFiltersParamToDashboardFilters,
    Dashboard,
    DashboardAvailableFilters,
    DashboardFilterRule,
    DashboardFilters,
    DashboardTileTypes,
    fieldId,
    FilterableField,
    isDashboardChartTileType,
} from '@lightdash/common';
import uniqBy from 'lodash-es/uniqBy';
import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useMount } from 'react-use';
import { FieldsWithSuggestions } from '../components/common/Filters/FiltersProvider';
import { isFilterConfigRevertButtonEnabled as hasSavedFilterValueChanged } from '../components/DashboardFilter/FilterConfiguration/utils';
import {
    useDashboardQuery,
    useDashboardsAvailableFilters,
} from '../hooks/dashboard/useDashboard';

const emptyFilters: DashboardFilters = {
    dimensions: [],
    metrics: [],
};

type DashboardContext = {
    dashboard: Dashboard | undefined;
    dashboardError: ApiError | null;
    fieldsWithSuggestions: FieldsWithSuggestions;
    dashboardTiles: Dashboard['tiles'] | [];
    setDashboardTiles: Dispatch<SetStateAction<Dashboard['tiles'] | []>>;
    haveTilesChanged: boolean;
    setHaveTilesChanged: Dispatch<SetStateAction<boolean>>;
    dashboardFilters: DashboardFilters;
    dashboardTemporaryFilters: DashboardFilters;
    allFilters: DashboardFilters;
    isLoadingDashboardFilters: boolean;
    isFetchingDashboardFilters: boolean;
    setDashboardFilters: Dispatch<SetStateAction<DashboardFilters>>;
    setDashboardTemporaryFilters: Dispatch<SetStateAction<DashboardFilters>>;
    addDimensionDashboardFilter: (
        filter: DashboardFilterRule,
        isTemporary: boolean,
    ) => void;
    updateDimensionDashboardFilter: (
        filter: DashboardFilterRule,
        index: number,
        isTemporary: boolean,
    ) => void;
    removeDimensionDashboardFilter: (
        index: number,
        isTemporary: boolean,
    ) => void;
    addMetricDashboardFilter: (
        filter: DashboardFilterRule,
        isTemporary: boolean,
    ) => void;
    haveFiltersChanged: boolean;
    setHaveFiltersChanged: Dispatch<SetStateAction<boolean>>;
    addSuggestions: (newSuggestionsMap: Record<string, string[]>) => void;
    allFilterableFields: FilterableField[] | undefined;
    filterableFieldsBySavedQueryUuid: DashboardAvailableFilters | undefined;
    filterableFieldsByTileUuid: DashboardAvailableFilters | undefined;
    hasChartTiles: boolean;
};

const Context = createContext<DashboardContext | undefined>(undefined);

export const DashboardProvider: React.FC = ({ children }) => {
    const { search, pathname } = useLocation();
    const history = useHistory();

    const { dashboardUuid } = useParams<{
        dashboardUuid: string;
    }>();

    const { data: dashboard, error: dashboardError } =
        useDashboardQuery(dashboardUuid);
    const [dashboardTiles, setDashboardTiles] = useState<Dashboard['tiles']>(
        [],
    );

    const [haveTilesChanged, setHaveTilesChanged] = useState<boolean>(false);
    const [fieldsWithSuggestions, setFieldsWithSuggestions] =
        useState<FieldsWithSuggestions>({});
    const [dashboardTemporaryFilters, setDashboardTemporaryFilters] =
        useState<DashboardFilters>(emptyFilters);
    const [dashboardFilters, setDashboardFilters] =
        useState<DashboardFilters>(emptyFilters);
    const [originalDashboardFilters, setOriginalDashboardFilters] =
        useState<DashboardFilters>(emptyFilters);
    const [haveFiltersChanged, setHaveFiltersChanged] =
        useState<boolean>(false);
    const [savedFiltersOverrides, setSavedFiltersOverrides] =
        useState<DashboardFilters>(emptyFilters);

    const tileSavedChartUuids = useMemo(() => {
        return dashboardTiles
            .filter(isDashboardChartTileType)
            .map((tile) => tile.properties.savedChartUuid)
            .filter((uuid): uuid is string => !!uuid);
    }, [dashboardTiles]);

    // Set filters to filters from database
    useEffect(() => {
        if (dashboard && dashboardFilters === emptyFilters) {
            if (
                savedFiltersOverrides.dimensions.length > 0 ||
                savedFiltersOverrides.metrics.length > 0
            ) {
                const dashboardFiltersWithOverrides = {
                    ...dashboard.filters,
                    dimensions: dashboard.filters.dimensions.map(
                        (dimension) => {
                            const override =
                                savedFiltersOverrides.dimensions.find(
                                    (overrideDimension) =>
                                        overrideDimension.id === dimension.id,
                                );
                            return override ? override : dimension;
                        },
                    ),
                };

                setDashboardFilters(dashboardFiltersWithOverrides);
            } else {
                setDashboardFilters(dashboard.filters);
            }

            setOriginalDashboardFilters(dashboard.filters);

            setHaveFiltersChanged(false);
        }
    }, [
        dashboardFilters,
        dashboard,
        savedFiltersOverrides.dimensions,
        savedFiltersOverrides.metrics.length,
    ]);

    // Updates url with temp filters
    useEffect(() => {
        const newParams = new URLSearchParams(search);
        if (
            dashboardTemporaryFilters?.dimensions?.length === 0 &&
            dashboardTemporaryFilters?.metrics?.length === 0
        ) {
            newParams.delete('tempFilters');
        } else {
            newParams.set(
                'tempFilters',
                JSON.stringify(
                    compressDashboardFiltersToParam(dashboardTemporaryFilters),
                ),
            );
        }

        if (savedFiltersOverrides?.dimensions?.length === 0) {
            newParams.delete('filters');
        } else {
            newParams.set(
                'filters',
                JSON.stringify(
                    compressDashboardFiltersToParam(savedFiltersOverrides),
                ),
            );
        }

        history.replace({
            pathname,
            search: newParams.toString(),
        });
    }, [
        dashboardFilters,
        dashboardTemporaryFilters,
        history,
        pathname,
        savedFiltersOverrides,
        search,
    ]);

    // Gets filters from URL and storage after redirect
    useMount(() => {
        const searchParams = new URLSearchParams(search);
        const tempFilterSearchParam = searchParams.get('tempFilters');
        // const filtersSearchParam = searchParams.get('filters');
        const unsavedDashboardFiltersRaw = sessionStorage.getItem(
            'unsavedDashboardFilters',
        );
        const overridesForSavedDashboardFiltersRaw =
            searchParams.get('filters');

        sessionStorage.removeItem('unsavedDashboardFilters');
        if (unsavedDashboardFiltersRaw) {
            const unsavedDashboardFilters = JSON.parse(
                unsavedDashboardFiltersRaw,
            );
            // TODO: this should probably merge with the filters
            // from the database. This will break if they diverge,
            // meaning there is a subtle race condition here
            setDashboardFilters(unsavedDashboardFilters);
        }
        if (tempFilterSearchParam) {
            setDashboardTemporaryFilters(
                convertDashboardFiltersParamToDashboardFilters(
                    JSON.parse(tempFilterSearchParam),
                ),
            );
        }

        if (overridesForSavedDashboardFiltersRaw) {
            setSavedFiltersOverrides(
                convertDashboardFiltersParamToDashboardFilters(
                    JSON.parse(overridesForSavedDashboardFiltersRaw),
                ),
            );
        }
    });

    const {
        isLoading: isLoadingDashboardFilters,
        isFetching: isFetchingDashboardFilters,
        data: filterableFieldsBySavedQueryUuid,
    } = useDashboardsAvailableFilters(tileSavedChartUuids);

    const filterableFieldsByTileUuid = useMemo(() => {
        if (!dashboard || !dashboardTiles || !filterableFieldsBySavedQueryUuid)
            return;

        return dashboardTiles
            .filter(isDashboardChartTileType)
            .reduce<DashboardAvailableFilters>((acc, tile) => {
                const savedChartUuid = tile.properties.savedChartUuid;
                if (!savedChartUuid) return acc;

                return {
                    ...acc,
                    [tile.uuid]:
                        filterableFieldsBySavedQueryUuid[savedChartUuid],
                };
            }, {});
    }, [dashboard, dashboardTiles, filterableFieldsBySavedQueryUuid]);

    const allFilterableFields = useMemo(() => {
        if (isLoadingDashboardFilters || !filterableFieldsBySavedQueryUuid)
            return;

        const allFilters = Object.values(
            filterableFieldsBySavedQueryUuid,
        ).flat();
        if (allFilters.length === 0) return;

        return uniqBy(allFilters, (f) => fieldId(f));
    }, [isLoadingDashboardFilters, filterableFieldsBySavedQueryUuid]);

    const allFilters = useMemo(() => {
        return {
            dimensions: [
                ...dashboardFilters.dimensions,
                ...dashboardTemporaryFilters?.dimensions,
            ],
            metrics: [
                ...dashboardFilters.metrics,
                ...dashboardTemporaryFilters?.metrics,
            ],
        };
    }, [dashboardFilters, dashboardTemporaryFilters]);

    const hasChartTiles = useMemo(
        () =>
            dashboardTiles.filter(
                (tile) => tile.type === DashboardTileTypes.SAVED_CHART,
            ).length >= 1,
        [dashboardTiles],
    );

    useEffect(() => {
        if (allFilterableFields && allFilterableFields.length > 0) {
            setFieldsWithSuggestions((prev) => {
                return allFilterableFields.reduce<FieldsWithSuggestions>(
                    (sum, field) => ({
                        ...sum,
                        [fieldId(field)]: {
                            ...field,
                            suggestions:
                                prev[fieldId(field)]?.suggestions || [],
                        },
                    }),
                    {},
                );
            });
        }
    }, [allFilterableFields]);

    const addDimensionDashboardFilter = useCallback(
        (filter: DashboardFilterRule, isTemporary: boolean) => {
            const setFunction = isTemporary
                ? setDashboardTemporaryFilters
                : setDashboardFilters;
            setFunction((previousFilters) => ({
                dimensions: [...previousFilters.dimensions, filter],
                metrics: previousFilters.metrics,
            }));
            setHaveFiltersChanged(true);
        },
        [setDashboardFilters],
    );

    const updateDimensionDashboardFilter = useCallback(
        (item: DashboardFilterRule, index: number, isTemporary: boolean) => {
            const setFunction = isTemporary
                ? setDashboardTemporaryFilters
                : setDashboardFilters;

            setFunction((previousFilters) => {
                if (!isTemporary) {
                    const hasChanged = hasSavedFilterValueChanged(
                        previousFilters.dimensions[index],
                        item,
                    );
                    const isReverted = !hasSavedFilterValueChanged(
                        originalDashboardFilters.dimensions[index],
                        item,
                    );

                    if (hasChanged) {
                        setSavedFiltersOverrides((prev) => {
                            if (isReverted) {
                                return {
                                    ...prev,
                                    dimensions: prev.dimensions.filter(
                                        (dim) => dim.id !== item.id,
                                    ),
                                };
                            } else {
                                return {
                                    ...prev,
                                    dimensions: prev.dimensions.some(
                                        (dim) => dim.id === item.id,
                                    )
                                        ? prev.dimensions.map((dim) =>
                                              dim.id === item.id ? item : dim,
                                          )
                                        : [...prev.dimensions, item],
                                };
                            }
                        });
                    }
                }

                return {
                    dimensions: [
                        ...previousFilters.dimensions.slice(0, index),
                        item,
                        ...previousFilters.dimensions.slice(index + 1),
                    ],
                    metrics: previousFilters.metrics,
                };
            });
            setHaveFiltersChanged(true);
        },
        [originalDashboardFilters],
    );

    const addMetricDashboardFilter = useCallback(
        (filter, isTemporary: boolean) => {
            const setFunction = isTemporary
                ? setDashboardTemporaryFilters
                : setDashboardFilters;
            setFunction((previousFilters) => ({
                dimensions: previousFilters.dimensions,
                metrics: [...previousFilters.metrics, filter],
            }));
            setHaveFiltersChanged(true);
        },
        [],
    );

    const removeDimensionDashboardFilter = useCallback(
        (index: number, isTemporary: boolean) => {
            const setFunction = isTemporary
                ? setDashboardTemporaryFilters
                : setDashboardFilters;
            setFunction((previousFilters) => {
                if (!isTemporary) {
                    setSavedFiltersOverrides((prev) => ({
                        ...prev,
                        dimensions: prev.dimensions.some((dim) => dim.id)
                            ? prev.dimensions.filter(
                                  (dim) =>
                                      dim.id !==
                                      previousFilters.dimensions[index].id,
                              )
                            : [...prev.dimensions],
                    }));
                }
                return {
                    dimensions: [
                        ...previousFilters.dimensions.slice(0, index),
                        ...previousFilters.dimensions.slice(index + 1),
                    ],
                    metrics: previousFilters.metrics,
                };
            });
            setHaveFiltersChanged(true);
        },
        [],
    );

    const addSuggestions = useCallback(
        (newSuggestionsMap: Record<string, string[]>) => {
            setFieldsWithSuggestions((prev) => {
                return Object.entries(prev).reduce<FieldsWithSuggestions>(
                    (sum, [key, field]) => {
                        const currentSuggestions = field?.suggestions || [];
                        const newSuggestions = newSuggestionsMap[key] || [];
                        const suggestions = Array.from(
                            new Set([...currentSuggestions, ...newSuggestions]),
                        ).sort((a, b) => a.localeCompare(b));
                        return { ...sum, [key]: { ...field, suggestions } };
                    },
                    {},
                );
            });
        },
        [],
    );

    const value = {
        dashboard,
        dashboardError,
        fieldsWithSuggestions,
        dashboardTiles,
        setDashboardTiles,
        haveTilesChanged,
        setHaveTilesChanged,
        setDashboardTemporaryFilters,
        dashboardFilters,
        dashboardTemporaryFilters,
        addDimensionDashboardFilter,
        updateDimensionDashboardFilter,
        removeDimensionDashboardFilter,
        addMetricDashboardFilter,
        setDashboardFilters,
        haveFiltersChanged,
        setHaveFiltersChanged,
        addSuggestions,
        allFilterableFields,
        filterableFieldsBySavedQueryUuid,
        isLoadingDashboardFilters,
        isFetchingDashboardFilters,
        filterableFieldsByTileUuid,
        allFilters,
        hasChartTiles,
    };
    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useDashboardContext = (): DashboardContext => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error(
            'useDashboardContext must be used within a DashboardProvider',
        );
    }
    return context;
};
