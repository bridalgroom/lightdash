import { createStyles } from '@mantine/core';

export const useTableStyles = createStyles((theme) => ({
    root: {
        '& thead tr': {
            backgroundColor: theme.colors.gray[0],
        },

        '& thead tr th': {
            color: theme.colors.gray[6],
            fontWeight: 600,
        },

        '& thead tr th, & tbody tr td': {
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        },

        '&[data-hover] tbody tr': theme.fn.hover({
            cursor: 'pointer',
            backgroundColor: theme.fn.rgba(theme.colors.gray[0], 0.5),
        }),
    },
    smallHeaderText: {
        '& thead tr th': {
            fontSize: theme.fontSizes.xs,
        },
    },
    alignLastTdRight: {
        '& tr td:last-child': {
            textAlign: 'right',
        },
    },
    smallPadding: {
        '& thead tr th, & tbody tr td': {
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        },
    },
    stickyHeader: {
        '& thead tr th': {
            zIndex: 1,
            borderBottom: 'none',
            // NOTE: This allows the sticky header to have a border-bottom when table is scrolled and border-collapse: collapse is set
            boxShadow: `inset 0px -1px 0px 0px ${theme.colors.gray[3]}`,
            backgroundColor: theme.colors.gray[0],
            position: 'sticky',
            top: 0,
        },
    },
}));
