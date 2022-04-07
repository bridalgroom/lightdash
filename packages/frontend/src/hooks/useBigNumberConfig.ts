import { ApiQueryResults, BigNumber } from 'common';
import { useCallback, useEffect, useMemo, useState } from 'react';

const useBigNumberConfig = (
    bigNumberConfigData: BigNumber | undefined,
    resultsData: ApiQueryResults | undefined,
) => {
    const metric = resultsData?.metricQuery.metrics[0];
    const bigNumber = metric && resultsData?.rows?.[0][metric].value.formatted;

    const [bigNumberLabel, setBigNumberName] = useState<
        BigNumber['label'] | undefined
    >(bigNumberConfigData?.label);

    useEffect(() => {
        setBigNumberName(bigNumberConfigData?.label);
    }, [resultsData]);

    const setBigNumberLabel = useCallback((name: string | undefined) => {
        setBigNumberName((prev) => name || prev);
    }, []);

    const validBigNumberConfig: BigNumber | undefined = useMemo(
        () =>
            bigNumberLabel
                ? {
                      label: bigNumberLabel,
                  }
                : undefined,
        [bigNumberLabel],
    );

    return {
        bigNumber,
        bigNumberLabel,
        setBigNumberLabel,
        validBigNumberConfig,
    };
};

export default useBigNumberConfig;
