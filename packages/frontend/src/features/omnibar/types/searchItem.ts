import { SearchItemType, SearchResult } from '@lightdash/common';

export const allSearchItemTypes = Object.values(SearchItemType);

export type SearchItem = {
    type: SearchItemType;
    typeLabel?: 'Table' | 'Joined table' | 'Dimension' | 'Metric';
    title: string;
    prefix?: string;
    description?: string;
    location: { pathname: string; search?: string };
    item?: SearchResult;
    searchRank?: number;
};
