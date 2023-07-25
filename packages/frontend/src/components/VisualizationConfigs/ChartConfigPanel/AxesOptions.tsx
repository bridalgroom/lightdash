import {
    Field,
    getAxisName,
    getItemId,
    getItemLabelWithoutTableName,
    isNumericItem,
    TableCalculation,
} from '@lightdash/common';
import {
    Checkbox,
    Group,
    SegmentedControl,
    Stack,
    Switch,
    Text,
    TextInput,
} from '@mantine/core';
import { FC, useCallback } from 'react';
import { useToggle } from 'react-use';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider';

interface MinMaxProps {
    label: string;
    min: string | undefined;
    max: string | undefined;
    setMin: (value: string | undefined) => void;
    setMax: (value: string | undefined) => void;
}

const AxisMinMax: FC<MinMaxProps> = ({ label, min, max, setMin, setMax }) => {
    const [isAuto, toggleAuto] = useToggle(!(min || max));
    const { track } = useTracking();

    const clearRange = useCallback(() => {
        if (!isAuto) {
            setMin(undefined);
            setMax(undefined);
        }
        return;
    }, [isAuto, setMin, setMax]);

    return (
        <>
            <Switch
                label={label}
                checked={isAuto}
                size="sm"
                onChange={() => {
                    toggleAuto((prev: boolean) => !prev);
                    clearRange();
                    track({
                        name: EventName.CUSTOM_AXIS_RANGE_TOGGLE_CLICKED,
                        properties: {
                            custom_axis_range: isAuto,
                        },
                    });
                }}
            />
            {!isAuto && (
                <Group noWrap spacing="xs">
                    <TextInput
                        label="Min"
                        placeholder="Min"
                        defaultValue={min || undefined}
                        onBlur={(e) => setMin(e.currentTarget.value)}
                    />

                    <TextInput
                        label="Max"
                        placeholder="Max"
                        defaultValue={max || undefined}
                        onBlur={(e) => setMax(e.currentTarget.value)}
                    />
                </Group>
            )}
        </>
    );
};

type Props = {
    items: (Field | TableCalculation)[];
};

const AxesOptions: FC<Props> = ({ items }) => {
    const {
        cartesianConfig: {
            dirtyLayout,
            dirtyEchartsConfig,
            setXAxisName,
            setYAxisName,
            setYMinValue,
            setYMaxValue,
            setShowGridX,
            setShowGridY,
            setInverseX,
        },
    } = useVisualizationContext();

    const xAxisField = items.find(
        (item) => getItemId(item) === dirtyLayout?.xField,
    );

    const selectedAxisInSeries = Array.from(
        new Set(
            dirtyEchartsConfig?.series?.map(({ yAxisIndex }) => yAxisIndex),
        ),
    );
    const isAxisTheSameForAllSeries: boolean =
        selectedAxisInSeries.length === 1;
    const selectedAxisIndex = selectedAxisInSeries[0] || 0;

    const [showFirstAxisRange, showSecondAxisRange] = (
        dirtyEchartsConfig?.series || []
    ).reduce<[boolean, boolean]>(
        (acc, series) => {
            const seriesField = items.find(
                (item) => getItemId(item) === series.encode.yRef.field,
            );
            if (isNumericItem(seriesField)) {
                acc[series.yAxisIndex || 0] = true;
            }
            return acc;
        },
        [false, false],
    );

    return (
        <Stack spacing="xs">
            <TextInput
                label={`${dirtyLayout?.flipAxes ? 'Y' : 'X'}-axis label`}
                placeholder="Enter axis label"
                defaultValue={
                    dirtyEchartsConfig?.xAxis?.[0]?.name ||
                    (xAxisField && getItemLabelWithoutTableName(xAxisField))
                }
                onBlur={(e) => setXAxisName(e.currentTarget.value)}
            />
            <Group noWrap>
                <Text fw={600}> Sort </Text>
                <SegmentedControl
                    size="sm"
                    color="blue"
                    defaultValue={
                        dirtyEchartsConfig?.xAxis?.[0]?.inverse
                            ? 'descending'
                            : 'ascending'
                    }
                    data={[
                        {
                            value: 'ascending',
                            label: 'Ascending',
                        },
                        {
                            value: 'descending',
                            label: 'Descending',
                        },
                    ]}
                    onChange={(value) => {
                        setInverseX(value === 'descending');
                    }}
                />
            </Group>
            <TextInput
                label={`${dirtyLayout?.flipAxes ? 'X' : 'Y'}-axis label (${
                    dirtyLayout?.flipAxes ? 'bottom' : 'left'
                })`}
                mt="xs"
                placeholder="Enter axis label"
                defaultValue={
                    dirtyEchartsConfig?.yAxis?.[0]?.name ||
                    getAxisName({
                        isAxisTheSameForAllSeries,
                        selectedAxisIndex,
                        axisReference: 'yRef',
                        axisIndex: 0,
                        series: dirtyEchartsConfig?.series,
                        items,
                    })
                }
                onBlur={(e) => setYAxisName(0, e.currentTarget.value)}
            />
            {showFirstAxisRange && (
                <AxisMinMax
                    label={`Auto ${
                        dirtyLayout?.flipAxes ? 'x' : 'y'
                    }-axis range (${
                        dirtyLayout?.flipAxes ? 'bottom' : 'left'
                    })`}
                    min={dirtyEchartsConfig?.yAxis?.[0]?.min}
                    max={dirtyEchartsConfig?.yAxis?.[0]?.max}
                    setMin={(newValue) => setYMinValue(0, newValue)}
                    setMax={(newValue) => setYMaxValue(0, newValue)}
                />
            )}

            <TextInput
                label={`${dirtyLayout?.flipAxes ? 'X' : 'Y'}-axis label (${
                    dirtyLayout?.flipAxes ? 'top' : 'right'
                })`}
                mt="xs"
                placeholder="Enter axis label"
                defaultValue={
                    dirtyEchartsConfig?.yAxis?.[1]?.name ||
                    getAxisName({
                        isAxisTheSameForAllSeries,
                        selectedAxisIndex,
                        axisReference: 'yRef',
                        axisIndex: 1,
                        series: dirtyEchartsConfig?.series,
                        items,
                    })
                }
                onBlur={(e) => setYAxisName(1, e.currentTarget.value)}
            />

            {showSecondAxisRange && (
                <AxisMinMax
                    label={`Auto ${
                        dirtyLayout?.flipAxes ? 'x' : 'y'
                    }-axis range? (${dirtyLayout?.flipAxes ? 'top' : 'right'})`}
                    min={dirtyEchartsConfig?.yAxis?.[1]?.min}
                    max={dirtyEchartsConfig?.yAxis?.[1]?.max}
                    setMin={(newValue) => setYMinValue(1, newValue)}
                    setMax={(newValue) => setYMaxValue(1, newValue)}
                />
            )}

            <Text fw={600}>Show grid</Text>
            <Checkbox
                label={`${dirtyLayout?.flipAxes ? 'Y' : 'X'}-axis`}
                checked={!!dirtyLayout?.showGridX}
                onChange={() => {
                    setShowGridX(!dirtyLayout?.showGridX);
                }}
            />

            <Checkbox
                label={`${dirtyLayout?.flipAxes ? 'X' : 'Y'}-axis`}
                checked={
                    dirtyLayout?.showGridY !== undefined
                        ? dirtyLayout?.showGridY
                        : true
                }
                onChange={() => {
                    setShowGridY(
                        dirtyLayout?.showGridY !== undefined
                            ? !dirtyLayout?.showGridY
                            : false,
                    );
                }}
            />
        </Stack>
    );
};

export default AxesOptions;
