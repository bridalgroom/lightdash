import { assertUnreachable, ChartType } from '@lightdash/common';
import { Center, Stack, Text } from '@mantine/core';
import { IconChartAreaLine } from '@tabler/icons-react';
import { FC, memo } from 'react';
import MantineIcon from '../common/MantineIcon';
import SimpleChart from '../SimpleChart';
import SimplePieChart from '../SimplePieChart';
import SimpleStatistic from '../SimpleStatistic';
import SimpleTable from '../SimpleTable';
import { useVisualizationContext } from './VisualizationProvider';

interface LightdashVisualizationProps {
    tileUuid?: string;
    isDashboard?: boolean;
    isTitleHidden?: boolean;
    className?: string;
    'data-testid'?: string;
}

const LightdashVisualization: FC<LightdashVisualizationProps> = memo(
    ({
        isDashboard = false,
        isTitleHidden = false,
        tileUuid,
        className,
        ...props
    }) => {
        const { chartType, minimal } = useVisualizationContext();

        switch (chartType) {
            case ChartType.BIG_NUMBER:
                return (
                    <SimpleStatistic
                        minimal={minimal}
                        isTitleHidden={isTitleHidden}
                        isDashboard={isDashboard}
                        tileUuid={tileUuid}
                        className={className}
                        data-testid={props['data-testid']}
                        {...props}
                    />
                );
            case ChartType.TABLE:
                return (
                    <SimpleTable
                        minimal={minimal}
                        tileUuid={tileUuid}
                        isDashboard={!!isDashboard}
                        className={className}
                        $shouldExpand
                        data-testid={props['data-testid']}
                        {...props}
                    />
                );
            case ChartType.CARTESIAN:
                return (
                    <SimpleChart
                        className={className}
                        isInDashboard={!!isDashboard}
                        $shouldExpand
                        data-testid={props['data-testid']}
                        {...props}
                    />
                );
            case ChartType.PIE:
                return (
                    <SimplePieChart
                        className={className}
                        tileUuid={tileUuid}
                        isInDashboard={!!isDashboard}
                        $shouldExpand
                        data-testid={props['data-testid']}
                        {...props}
                    />
                );
            case ChartType.CUSTOM:
                // TODO: Custom component here
                return (
                    <Center>
                        <Stack align="center">
                            <MantineIcon
                                color="blue"
                                icon={IconChartAreaLine}
                                size="9xl"
                            />
                            <Text>Fancy chart here</Text>
                        </Stack>
                    </Center>
                );

            default:
                return assertUnreachable(
                    chartType,
                    `Chart type ${chartType} not implemented`,
                );
        }
    },
);

export default LightdashVisualization;
