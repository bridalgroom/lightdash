import { useMantineTheme } from '@mantine/core';
import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll to dashboard comment via search param `tileUuid`
 * @param ref - ref to the element to scroll to
 * @param enabled - if true, scroll to the element
 * @param dashboardTileUuid - the dashboard tile uuid
 * @param onScrolled - callback to call when scrolled
 */
export const useScrollToDashboardCommentViaSearchParam = ({
    ref,
    enabled,
    dashboardTileUuid,
    onScrolled,
}: {
    ref: React.MutableRefObject<HTMLDivElement | null>;
    enabled: boolean;
    dashboardTileUuid: string;
    onScrolled: () => void;
}) => {
    const theme = useMantineTheme();
    const [isSuccess, setIsSuccess] = useState(false);
    // get search with uselocation param tile uuid
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const tileUuid = searchParams.get('tileUuid');

    useLayoutEffect(() => {
        if (
            !isSuccess &&
            tileUuid === dashboardTileUuid &&
            ref.current &&
            enabled
        ) {
            onScrolled();
            setTimeout(() => {
                if (ref.current)
                    ref.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                setIsSuccess(true);
                ref.current?.animate(
                    [
                        {
                            backgroundColor: 'transparent',
                            borderRadius: theme.radius.sm,
                        },
                        {
                            backgroundColor: theme.colors.yellow[1],
                            borderRadius: theme.radius.sm,
                        },
                        {
                            backgroundColor: 'transparent',
                            borderRadius: theme.radius.sm,
                        },
                    ],
                    {
                        duration: 4000,
                        iterations: 5,
                    },
                );
            }, 200);
        }
    }, [
        tileUuid,
        dashboardTileUuid,
        enabled,
        ref,
        onScrolled,
        isSuccess,
        theme.radius.sm,
        theme.colors.yellow,
    ]);
};
