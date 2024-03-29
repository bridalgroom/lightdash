import {
    CartesianSeriesType,
    getItemId,
    isCustomDimension,
    isDimension,
    isNumericItem,
    replaceStringInArray,
    type CustomDimension,
    type Field,
    type TableCalculation,
} from '@lightdash/common';
import {
    ActionIcon,
    Button,
    CloseButton,
    Group,
    SegmentedControl,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { IconRotate360 } from '@tabler/icons-react';
import { useCallback, useMemo, type FC } from 'react';
import { EMPTY_X_AXIS } from '../../../hooks/cartesianChartConfig/useCartesianChartConfig';
import FieldSelect from '../../common/FieldSelect';
import MantineIcon from '../../common/MantineIcon';
import { isCartesianVisualizationConfig } from '../../LightdashVisualization/VisualizationConfigCartesian';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider';
import { Config } from '../common/Config';
import { MAX_PIVOTS } from '../TableConfigPanel/GeneralSettings';

type Props = {
    items: (Field | TableCalculation | CustomDimension)[];
};

// TODO: Refactor this component to use the ConfigGroup component ?
export const AddButton = ({ onClick }: { onClick: () => void }) => (
    <Button
        size="sm"
        variant="subtle"
        compact
        leftIcon="+"
        onClick={onClick}
        styles={{
            leftIcon: {
                marginRight: 2,
            },
        }}
    >
        Add
    </Button>
);

const FieldLayoutOptions: FC<Props> = ({ items }) => {
    const { visualizationConfig, pivotDimensions, setPivotDimensions } =
        useVisualizationContext();

    const isCartesianChart =
        isCartesianVisualizationConfig(visualizationConfig);

    const cartesianType = isCartesianChart
        ? visualizationConfig.chartConfig.dirtyChartType
        : undefined;

    const canBeStacked =
        cartesianType !== CartesianSeriesType.LINE &&
        cartesianType !== CartesianSeriesType.SCATTER &&
        cartesianType !== CartesianSeriesType.AREA;

    // X axis logic
    const xAxisField = useMemo(() => {
        if (!isCartesianChart) return undefined;
        const { dirtyLayout } = visualizationConfig.chartConfig;

        return items.find((item) => getItemId(item) === dirtyLayout?.xField);
    }, [items, isCartesianChart, visualizationConfig]);

    const isXAxisFieldNumeric = useMemo(
        () => isNumericItem(xAxisField),
        [xAxisField],
    );

    // Y axis logic
    const yFields = useMemo(() => {
        if (!isCartesianChart) return [];
        const { dirtyLayout } = visualizationConfig.chartConfig;

        return dirtyLayout?.yField || [];
    }, [isCartesianChart, visualizationConfig]);

    const yActiveField = useCallback(
        (field: string) => {
            return items.find((item) => getItemId(item) === field);
        },
        [items],
    );

    const availableYFields = useMemo(() => {
        if (!isCartesianChart) return [];

        const { dirtyLayout } = visualizationConfig.chartConfig;

        return items.filter(
            (item) => !dirtyLayout?.yField?.includes(getItemId(item)),
        );
    }, [isCartesianChart, items, visualizationConfig]);

    // Group series logic
    const availableDimensions = useMemo(() => {
        return items.filter(
            (item) => isDimension(item) || isCustomDimension(item),
        );
    }, [items]);

    const chartHasMetricOrTableCalc = useMemo(() => {
        if (!isCartesianChart) return false;

        const { validConfig } = visualizationConfig.chartConfig;

        const yField = validConfig?.layout.yField;

        if (!yField) return false;

        return items.some(
            (item) => !isDimension(item) && yField.includes(getItemId(item)),
        );
    }, [isCartesianChart, items, visualizationConfig]);

    const availableGroupByDimensions = useMemo(
        () =>
            availableDimensions.filter(
                (item) => !pivotDimensions?.includes(getItemId(item)),
            ),
        [availableDimensions, pivotDimensions],
    );

    const canAddPivot = useMemo(
        () =>
            chartHasMetricOrTableCalc &&
            availableGroupByDimensions.length > 0 &&
            (!pivotDimensions || pivotDimensions.length < MAX_PIVOTS),
        [
            availableGroupByDimensions.length,
            pivotDimensions,
            chartHasMetricOrTableCalc,
        ],
    );

    const handleOnChangeOfXAxisField = useCallback(
        (newValue: Field | TableCalculation | CustomDimension | undefined) => {
            if (!isCartesianChart) return;
            const { setXField, setStacking, isStacked } =
                visualizationConfig.chartConfig;

            const fieldId = newValue ? getItemId(newValue) : undefined;
            setXField(fieldId ?? undefined);

            if (newValue && isStacked && isNumericItem(newValue)) {
                setStacking(false);
            }
        },
        [isCartesianChart, visualizationConfig],
    );

    if (!isCartesianChart) return null;

    const {
        validConfig,
        dirtyLayout,
        setXField,
        setStacking,
        setFlipAxis,
        isStacked,
        updateYField,
        removeSingleSeries,
        addSingleSeries,
    } = visualizationConfig.chartConfig;

    return (
        <Stack>
            <Config.Group>
                <Config.LabelGroup>
                    <Config.Label>{`${
                        validConfig?.layout.flipAxes ? 'Y' : 'X'
                    }-axis`}</Config.Label>
                    <Group spacing="two">
                        <Tooltip label={<Text fz="xs">Flip Axes</Text>}>
                            <ActionIcon
                                onClick={() =>
                                    setFlipAxis(!dirtyLayout?.flipAxes)
                                }
                                color="blue.4"
                            >
                                <MantineIcon icon={IconRotate360} />
                            </ActionIcon>
                        </Tooltip>
                        {dirtyLayout?.xField === EMPTY_X_AXIS && (
                            <AddButton
                                onClick={() => setXField(getItemId(items[0]))}
                            />
                        )}
                    </Group>
                </Config.LabelGroup>
                {dirtyLayout?.xField !== EMPTY_X_AXIS && (
                    <FieldSelect
                        data-testid="x-axis-field-select"
                        item={xAxisField}
                        items={items}
                        onChange={handleOnChangeOfXAxisField}
                        rightSection={
                            <CloseButton
                                onClick={() => {
                                    setXField(EMPTY_X_AXIS);
                                }}
                            />
                        }
                    />
                )}
            </Config.Group>

            <Config.Group>
                <Config.LabelGroup>
                    <Config.Label>{`${
                        validConfig?.layout.flipAxes ? 'X' : 'Y'
                    }-axis`}</Config.Label>
                    {availableYFields.length > 0 && (
                        <AddButton
                            onClick={() =>
                                addSingleSeries(getItemId(availableYFields[0]))
                            }
                        />
                    )}
                </Config.LabelGroup>

                {yFields.map((field, index) => {
                    const activeField = yActiveField(field);
                    const yFieldsOptions = activeField
                        ? [activeField, ...availableYFields]
                        : availableYFields;
                    return (
                        <FieldSelect
                            key={`${field}-y-axis`}
                            data-testid="y-axis-field-select"
                            item={activeField}
                            items={yFieldsOptions}
                            onChange={(newValue) => {
                                updateYField(
                                    index,
                                    newValue ? getItemId(newValue) : '',
                                );
                            }}
                            rightSection={
                                yFields?.length !== 1 && (
                                    <CloseButton
                                        onClick={() => {
                                            removeSingleSeries(index);
                                        }}
                                    />
                                )
                            }
                        />
                    );
                })}
            </Config.Group>

            <Config.Group>
                <Stack spacing="xs">
                    <Config.LabelGroup>
                        <Group spacing="one">
                            <Config.Label>Group</Config.Label>
                        </Group>
                        {canAddPivot && (
                            <AddButton
                                onClick={() =>
                                    setPivotDimensions([
                                        ...(pivotDimensions || []),
                                        getItemId(
                                            availableGroupByDimensions[0],
                                        ),
                                    ])
                                }
                            />
                        )}
                    </Config.LabelGroup>
                    {!chartHasMetricOrTableCalc &&
                        !(pivotDimensions && !!pivotDimensions.length) && (
                            <FieldSelect
                                items={[]}
                                onChange={() => {}}
                                disabled
                                placeholder="You need at least one metric in your chart to add a group"
                            />
                        )}
                </Stack>

                <Stack spacing="xs">
                    {pivotDimensions &&
                        pivotDimensions.map((pivotKey) => {
                            // Group series logic
                            const groupSelectedField = availableDimensions.find(
                                (item) => getItemId(item) === pivotKey,
                            );
                            const fieldOptions = groupSelectedField
                                ? [
                                      groupSelectedField,
                                      ...availableGroupByDimensions,
                                  ]
                                : availableGroupByDimensions;
                            const activeField = chartHasMetricOrTableCalc
                                ? groupSelectedField
                                : undefined;
                            return (
                                <Group spacing="xs" key={pivotKey}>
                                    <FieldSelect
                                        disabled={!chartHasMetricOrTableCalc}
                                        placeholder="Select a field to group by"
                                        item={activeField}
                                        items={fieldOptions}
                                        onChange={(newValue) => {
                                            if (!newValue) return;
                                            setPivotDimensions(
                                                pivotDimensions
                                                    ? replaceStringInArray(
                                                          pivotDimensions,
                                                          pivotKey,
                                                          getItemId(newValue),
                                                      )
                                                    : [getItemId(newValue)],
                                            );
                                        }}
                                        rightSection={
                                            groupSelectedField && (
                                                <CloseButton
                                                    onClick={() => {
                                                        setPivotDimensions(
                                                            pivotDimensions.filter(
                                                                (key) =>
                                                                    key !==
                                                                    pivotKey,
                                                            ),
                                                        );
                                                    }}
                                                />
                                            )
                                        }
                                    />
                                </Group>
                            );
                        })}
                </Stack>
                {pivotDimensions && pivotDimensions.length > 0 && canBeStacked && (
                    <Tooltip
                        variant="xs"
                        label="x-axis must be non-numeric to enable stacking"
                        withinPortal
                        position="top-start"
                        disabled={!isXAxisFieldNumeric}
                    >
                        <Group spacing="xs">
                            <Config.SubLabel>Stacking</Config.SubLabel>
                            <SegmentedControl
                                disabled={isXAxisFieldNumeric}
                                value={isStacked ? 'stack' : 'noStacking'}
                                onChange={(value) =>
                                    setStacking(value === 'stack')
                                }
                                data={[
                                    {
                                        label: 'None',
                                        value: 'noStacking',
                                    },
                                    { label: 'Stack', value: 'stack' },
                                ]}
                            />
                        </Group>
                    </Tooltip>
                )}
            </Config.Group>
        </Stack>
    );
};

export default FieldLayoutOptions;
