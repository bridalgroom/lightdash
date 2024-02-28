import { ApiError } from '@lightdash/common';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ComponentProps } from 'react';
import {
    createMetricFlowQuery,
    CreateMetricFlowQueryResponse,
    getMetricFlowQueryResults,
    GetMetricFlowQueryResultsResponse,
    QueryStatus,
    TimeGranularity,
} from '../../../api/MetricFlowAPI';
import Table from '../../../components/common/Table';

type ApiRequestsState = Pick<
    ReturnType<typeof useQuery<GetMetricFlowQueryResultsResponse, ApiError>>,
    'isLoading' | 'data' | 'error'
> &
    Pick<
        ReturnType<typeof useQuery<CreateMetricFlowQueryResponse, ApiError>>,
        'refetch'
    > & {
        status: ComponentProps<typeof Table>['status'];
    };

const useMetricFlowQueryResults = (
    projectUuid: string | undefined,
    query?: {
        metrics: Record<string, {}>;
        dimensions: Record<string, { grain: TimeGranularity }>;
    },
    useCreateQueryOptions?: UseQueryOptions<
        CreateMetricFlowQueryResponse,
        ApiError
    >,
    useResultQueryOptions?: UseQueryOptions<
        GetMetricFlowQueryResultsResponse,
        ApiError
    >,
): ApiRequestsState => {
    const metricFlowQuery = useQuery<CreateMetricFlowQueryResponse, ApiError>({
        queryKey: ['metric_flow_query', projectUuid, query],
        enabled: !!projectUuid && !!Object.keys(query?.metrics ?? {}).length,
        queryFn: () => createMetricFlowQuery(projectUuid!, query!),
        staleTime: 0,
        cacheTime: 0,
        ...useCreateQueryOptions,
    });
    const queryId = metricFlowQuery.data?.createQuery.queryId;
    const metricFlowQueryResultsQuery = useQuery<
        GetMetricFlowQueryResultsResponse,
        ApiError
    >({
        queryKey: ['metric_flow_query_results', projectUuid, queryId],
        enabled: !!projectUuid && !!queryId && metricFlowQuery.isSuccess,
        queryFn: () => getMetricFlowQueryResults(projectUuid!, queryId!),
        refetchInterval: (refetchData) => {
            return refetchData === undefined ||
                [QueryStatus.SUCCESSFUL, QueryStatus.FAILED].includes(
                    refetchData.query.status,
                )
                ? false
                : 500;
        },
        ...useResultQueryOptions,
    });

    const isResultsQueryRefetching =
        !!metricFlowQueryResultsQuery.data &&
        ![QueryStatus.SUCCESSFUL, QueryStatus.FAILED].includes(
            metricFlowQueryResultsQuery.data?.query.status,
        );

    if (isResultsQueryRefetching) {
        return {
            isLoading: true,
            error: null,
            data: undefined,
            status: 'loading',
            refetch: metricFlowQuery.refetch,
        };
    }

    if (metricFlowQueryResultsQuery.data?.query.status === QueryStatus.FAILED) {
        return {
            isLoading: false,
            error: {
                status: 'error',
                error: {
                    name: 'ApiError',
                    statusCode: 500,
                    message:
                        metricFlowQueryResultsQuery.data.query.error ||
                        'Unknown error',
                    data: {},
                },
            },
            data: undefined,
            status: 'error',
            refetch: metricFlowQuery.refetch,
        };
    }

    const isIdle = !metricFlowQuery.isFetched && !metricFlowQuery.isFetching;
    if (isIdle) {
        return {
            isLoading: false,
            error: null,
            data: undefined,
            status: 'idle',
            refetch: metricFlowQuery.refetch,
        };
    }

    return {
        isLoading:
            metricFlowQuery.isInitialLoading ||
            metricFlowQueryResultsQuery.isInitialLoading,
        error: metricFlowQuery.error || metricFlowQueryResultsQuery.error,
        data: metricFlowQueryResultsQuery.data,
        status: metricFlowQuery.isInitialLoading
            ? metricFlowQuery.status
            : metricFlowQueryResultsQuery.status,
        refetch: metricFlowQuery.refetch,
    };
};

export default useMetricFlowQueryResults;
