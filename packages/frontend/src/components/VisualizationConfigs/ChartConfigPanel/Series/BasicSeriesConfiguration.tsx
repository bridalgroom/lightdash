import { type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import {
    getItemLabelWithoutTableName,
    type CartesianChartLayout,
    type CustomDimension,
    type Field,
    type Series,
    type TableCalculation,
} from '@lightdash/common';
import { Box, Group, Stack, Text } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import React, { type FC } from 'react';
import MantineIcon from '../../../common/MantineIcon';
import SingleSeriesConfiguration from './SingleSeriesConfiguration';

type BasicSeriesConfigurationProps = {
    isSingle: boolean;
    layout?: CartesianChartLayout;
    series: Series;
    item: Field | TableCalculation | CustomDimension;
    updateSingleSeries: (series: Series) => void;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
};

const BasicSeriesConfiguration: FC<BasicSeriesConfigurationProps> = ({
    isSingle,
    layout,
    series,
    item,
    updateSingleSeries,
    dragHandleProps,
}) => {
    return (
        <Stack spacing="xs">
            <Group noWrap spacing="two">
                <Box
                    {...dragHandleProps}
                    sx={{
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                    }}
                >
                    <MantineIcon icon={IconGripVertical} />
                </Box>
                <Text fw={500}> {getItemLabelWithoutTableName(item)} </Text>
            </Group>
            <SingleSeriesConfiguration
                layout={layout}
                series={series}
                isSingle={isSingle}
                seriesLabel={getItemLabelWithoutTableName(item)}
                updateSingleSeries={updateSingleSeries}
            />
        </Stack>
    );
};

export default BasicSeriesConfiguration;
