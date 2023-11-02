import {
    ApiError,
    ApiGdriveAccessTokenResponse,
    ApiScheduledDownloadCsv,
    UploadMetricGsheet,
} from '@lightdash/common';
import { useState } from 'react';
import { useQuery, UseQueryOptions } from 'react-query';
import { lightdashApi } from '../../api';
import { convertDateFilters } from '../../utils/dateFilter';
import useHealth from '../health/useHealth';

const getGdriveAccessToken = async () =>
    lightdashApi<ApiGdriveAccessTokenResponse['results']>({
        url: `/gdrive/get-access-token`,
        method: 'GET',
        body: undefined,
    });

export const useGdriveAccessToken = (
    useQueryOptions?: UseQueryOptions<
        ApiGdriveAccessTokenResponse['results'],
        ApiError
    >,
) => {
    const health = useHealth();
    const gdriveUrl = `${health?.data?.siteUrl}/api/v1/login/gdrive`;
    const [googleLoginPopup, setGoogleLoginPopup] = useState<Window | null>(
        null,
    );

    return useQuery<ApiGdriveAccessTokenResponse['results'], ApiError>({
        queryKey: ['gdrive_access_token'],
        queryFn: getGdriveAccessToken,
        retry: false,
        refetchInterval: 2000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        ...useQueryOptions,
        onSuccess: (result) => {
            if (googleLoginPopup) {
                googleLoginPopup.close();
            }
            useQueryOptions?.onSuccess?.(result);
        },
        onError: () => {
            if (googleLoginPopup?.closed) return false;
            if (!googleLoginPopup) {
                setGoogleLoginPopup(
                    window.open(
                        gdriveUrl,
                        'login-popup',
                        'width=600,height=600',
                    ),
                );
            }
        },
    });
};

export const uploadGsheet = async (gsheetMetric: UploadMetricGsheet) => {
    const timezoneFixQuery = {
        ...gsheetMetric.metricQuery,
        filters: convertDateFilters(gsheetMetric.metricQuery.filters),
    };
    return lightdashApi<ApiScheduledDownloadCsv>({
        url: `/gdrive/upload-gsheet`,
        method: 'POST',
        body: JSON.stringify({
            ...gsheetMetric,
            metricQuery: timezoneFixQuery,
        }),
    });
};
