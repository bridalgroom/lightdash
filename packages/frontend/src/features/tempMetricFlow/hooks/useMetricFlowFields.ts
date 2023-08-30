import { ApiError } from '@lightdash/common';
import { uniqWith } from 'lodash-es';
import { useQuery } from 'react-query';
import { UseQueryOptions } from 'react-query/types/react/types';
import {
    getMetricFlowFields,
    GetMetricFlowFieldsResponse,
} from '../../../api/MetricFlowAPI';

const useMetricFlowFields = (
    projectUuid?: string,
    selectedFields?: {
        metrics: string[];
        dimensions: string[];
    },
    useQueryOptions?: UseQueryOptions<GetMetricFlowFieldsResponse, ApiError>,
) => {
    return useQuery<GetMetricFlowFieldsResponse, ApiError>({
        queryKey: ['metric_flow_fields', projectUuid, selectedFields],
        enabled: !!projectUuid,
        queryFn: () => getMetricFlowFields(projectUuid!, selectedFields),
        keepPreviousData: true,
        select: (data) => {
            // If no dimensions are returned, use the dimensions from the metrics
            if (!selectedFields || selectedFields.metrics.length === 0) {
                const dimensionsFromMetrics = uniqWith(
                    data.metricsForDimensions
                        .map((metric) => metric.dimensions)
                        .flat(),
                    (a, b) => a.name === b.name,
                );
                return {
                    ...data,
                    dimensions: dimensionsFromMetrics,
                };
            }
            return data;
        },
        ...useQueryOptions,
    });
};

export default useMetricFlowFields;
