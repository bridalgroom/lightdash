import { SearchFilters, SearchResults } from '@lightdash/common';
import { isNil, omitBy } from 'lodash';
import { lightdashApi } from '../../../api';

export const getSearchResults = async ({
    projectUuid,
    query,
    filters,
}: {
    projectUuid: string;
    query: string;
    filters?: SearchFilters;
}) => {
    const sanitizedFilters = omitBy(filters, isNil);
    const searchParams = sanitizedFilters
        ? new URLSearchParams(sanitizedFilters).toString()
        : undefined;

    return lightdashApi<SearchResults>({
        url: `/projects/${projectUuid}/search/${encodeURIComponent(query)}${
            searchParams ? `?${searchParams}` : ''
        }`,
        method: 'GET',
        body: undefined,
    });
};
