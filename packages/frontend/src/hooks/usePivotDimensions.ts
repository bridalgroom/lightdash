import { ApiQueryResults } from '@lightdash/common';
import { useMemo, useState } from 'react';

const usePivotDimensions = (
    initialPivotDimensions: string[] | undefined,
    resultsData: ApiQueryResults | undefined,
) => {
    const [dirtyPivotDimensions, setPivotDimensions] = useState(
        initialPivotDimensions,
    );

    const validPivotDimensions = useMemo(() => {
        if (resultsData) {
            const availableDimensions = resultsData
                ? resultsData.metricQuery.dimensions
                : [];
            if (
                dirtyPivotDimensions &&
                dirtyPivotDimensions.every((key) =>
                    availableDimensions.includes(key),
                )
            ) {
                return dirtyPivotDimensions;
            }
            return undefined;
        }
    }, [resultsData, dirtyPivotDimensions]);

    return {
        validPivotDimensions,
        setPivotDimensions,
    };
};

export default usePivotDimensions;
