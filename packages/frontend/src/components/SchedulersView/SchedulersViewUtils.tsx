import {
    assertUnreachable,
    SchedulerFormat,
    SchedulerJobStatus,
    SchedulerWithLogs,
} from '@lightdash/common';
import { MantineTheme, Tooltip } from '@mantine/core';
import {
    IconAlertTriangleFilled,
    IconCircleCheckFilled,
    IconClockFilled,
    IconCsv,
    IconPhoto,
    IconProgress,
} from '@tabler/icons-react';
import moment from 'moment';
import React from 'react';
import MantineIcon from '../common/MantineIcon';
import { IconBox } from '../common/ResourceIcon';

export type SchedulerItem = SchedulerWithLogs['schedulers'][number];
export type Log = SchedulerWithLogs['logs'][number];

type ColumnName =
    | 'name'
    | 'destinations'
    | 'frequency'
    | 'lastDelivery'
    | 'actions'
    | 'jobs'
    | 'deliveryScheduled'
    | 'deliveryStarted'
    | 'status';

export interface Column {
    id: ColumnName;
    label?: string;
    cell: (
        item: SchedulerItem,
        logs?: Log[],
        jobGroup?: string,
    ) => React.ReactNode;
    meta?: {
        style: React.CSSProperties;
    };
}

export const getSchedulerIcon = (item: SchedulerItem, theme: MantineTheme) => {
    switch (item.format) {
        case SchedulerFormat.CSV:
            return (
                <IconBox
                    icon={IconCsv}
                    color="indigo.6"
                    style={{ color: theme.colors.indigo[6] }}
                />
            );
        case SchedulerFormat.IMAGE:
            return (
                <IconBox
                    icon={IconPhoto}
                    color="indigo.6"
                    style={{ color: theme.colors.indigo[6] }}
                />
            );
        default:
            return assertUnreachable(
                item.format,
                'Resource type not supported',
            );
    }
};

export const getLogStatusIcon = (log: Log, theme: MantineTheme) => {
    switch (log.status) {
        case SchedulerJobStatus.SCHEDULED:
            return (
                <Tooltip label={SchedulerJobStatus.SCHEDULED}>
                    <MantineIcon
                        icon={IconClockFilled}
                        color="blue.3"
                        style={{ color: theme.colors.blue[3] }}
                    />
                </Tooltip>
            );
        case SchedulerJobStatus.STARTED:
            return (
                <Tooltip label={SchedulerJobStatus.STARTED}>
                    <MantineIcon
                        icon={IconProgress}
                        color="yellow.6"
                        style={{ color: theme.colors.yellow[6] }}
                    />
                </Tooltip>
            );
        case SchedulerJobStatus.COMPLETED:
            return (
                <Tooltip label={SchedulerJobStatus.COMPLETED}>
                    <MantineIcon
                        icon={IconCircleCheckFilled}
                        color="green.6"
                        style={{ color: theme.colors.green[6] }}
                    />
                </Tooltip>
            );
        case SchedulerJobStatus.ERROR:
            return (
                <Tooltip label={log?.details?.error} multiline>
                    <MantineIcon
                        icon={IconAlertTriangleFilled}
                        color="red.6"
                        style={{ color: theme.colors.red[6] }}
                    />
                </Tooltip>
            );
        default:
            return assertUnreachable(log.status, 'Resource type not supported');
    }
};

export const getSchedulerLink = (item: SchedulerItem, projectUuid: string) => {
    return item.savedChartUuid
        ? `/projects/${projectUuid}/saved/${item.savedChartUuid}/view/?scheduler_uuid=${item.schedulerUuid}`
        : `/projects/${projectUuid}/dashboards/${item.dashboardUuid}/view/?scheduler_uuid=${item.schedulerUuid}`;
};
export const getItemLink = (item: SchedulerItem, projectUuid: string) => {
    return item.savedChartUuid
        ? `/projects/${projectUuid}/saved/${item.savedChartUuid}/view`
        : `/projects/${projectUuid}/dashboards/${item.dashboardUuid}/view`;
};

export const formatTime = (date: Date) =>
    moment(date).format('YYYY/MM/DD HH:mm A');
