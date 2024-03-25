import {
    fieldId as getFieldId,
    isField,
    type CompiledDimension,
    type CustomDimension,
    type Field,
    type Series,
    type TableCalculation,
} from '@lightdash/common';
import { useCallback, useMemo, type FC } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useProject } from '../../../../hooks/useProject';
import MantineIcon from '../../../common/MantineIcon';
import { type ReferenceLineField } from '../../../common/ReferenceLine';
import { isCartesianVisualizationConfig } from '../../../LightdashVisualization/VisualizationConfigCartesian';
import { useVisualizationContext } from '../../../LightdashVisualization/VisualizationProvider';
import { ReferenceLine, type ReferenceLineProps } from './ReferenceLine';

type Props = {
    items: (Field | TableCalculation | CompiledDimension | CustomDimension)[];
    projectUuid: string;
};

export const ReferenceLines: FC<Props> = ({ items, projectUuid }) => {
    const { visualizationConfig } = useVisualizationContext();
    const isCartesianChart =
        isCartesianVisualizationConfig(visualizationConfig);

    const project = useProject(projectUuid);
    const startOfWeek = useMemo(
        () => project.data?.warehouseConnection?.startOfWeek,
        [project],
    );
    const updateReferenceLine: ReferenceLineProps['updateReferenceLine'] =
        useCallback(
            ({
                value,
                field,
                label,
                lineColor,
                useAverage,
                labelPosition,
                lineId,
            }) => {
                if (!isCartesianChart) return;

                const {
                    dirtyEchartsConfig,
                    dirtyLayout,
                    referenceLines,
                    setReferenceLines,
                } = visualizationConfig.chartConfig;

                if (field) {
                    const fieldId = isField(field)
                        ? getFieldId(field)
                        : field.name;

                    if (dirtyEchartsConfig?.series) {
                        const selectedSeries = dirtyEchartsConfig?.series.find(
                            (serie: Series) =>
                                (dirtyLayout?.xField === fieldId
                                    ? serie.encode.xRef
                                    : serie.encode.yRef
                                ).field === fieldId,
                        );
                        if (selectedSeries === undefined) return;

                        const dataWithAxis = {
                            name: label,
                            type: useAverage ? 'average' : undefined,
                            uuid: lineId,
                            lineStyle: { color: lineColor },
                            label: {
                                position: labelPosition || 'end',
                                formatter: label
                                    ? `${label}${useAverage ? ': {c}' : ''}`
                                    : undefined,
                            },
                            xAxis:
                                dirtyLayout?.xField === fieldId
                                    ? value
                                    : undefined,
                            yAxis:
                                dirtyLayout?.xField === fieldId
                                    ? undefined
                                    : useAverage
                                    ? undefined
                                    : value || '',
                        };

                        const updatedReferenceLines: ReferenceLineField[] =
                            referenceLines.map((line) => {
                                // Check uuid, .value and .name for backwards compatibility
                                if (
                                    line.data.uuid === lineId ||
                                    line.data.value === lineId ||
                                    line.data.name === lineId
                                )
                                    return {
                                        fieldId: fieldId,
                                        data: dataWithAxis,
                                    };
                                else return line;
                            });

                        setReferenceLines(updatedReferenceLines);
                    }
                }
            },
            [isCartesianChart, visualizationConfig],
        );

    const addReferenceLine = useCallback(() => {
        if (!isCartesianChart) return;

        const { referenceLines, setReferenceLines } =
            visualizationConfig.chartConfig;

        const newReferenceLine: ReferenceLineField = {
            data: {
                uuid: uuidv4(),
            },
        };
        setReferenceLines([...referenceLines, newReferenceLine]);
    }, [isCartesianChart, visualizationConfig]);

    const removeReferenceLine = useCallback(
        (markLineId: string) => {
            if (!isCartesianChart) return;

            const {
                dirtyEchartsConfig,
                referenceLines,
                setReferenceLines,
                updateSeries,
            } = visualizationConfig.chartConfig;

            if (!dirtyEchartsConfig?.series) return;
            const series = dirtyEchartsConfig?.series.map((serie) => {
                return {
                    ...serie,
                    markLine: {
                        ...serie.markLine,
                        data:
                            serie.markLine?.data.filter(
                                (data) =>
                                    data.uuid !== markLineId &&
                                    data.value !== markLineId &&
                                    data.name !== markLineId,
                            ) || [],
                    },
                };
            });

            updateSeries(series);

            setReferenceLines(
                referenceLines.filter(
                    (line) =>
                        line.data.uuid !== markLineId &&
                        line.data.value !== markLineId &&
                        line.data.name !== markLineId,
                ),
            );
        },
        [isCartesianChart, visualizationConfig],
    );

    if (!isCartesianChart) return null;

    const { referenceLines } = visualizationConfig.chartConfig;

    return (
        <Stack spacing="xs">
            <Text fw={600}>Reference lines</Text>
            {referenceLines &&
                referenceLines.map((line, index) => {
                    return (
                        <ReferenceLine
                            key={line.data.uuid}
                            data-testid={line.data.uuid}
                            index={index + 1}
                            isDefaultOpen={referenceLines.length <= 1}
                            items={items}
                            startOfWeek={startOfWeek ?? undefined}
                            referenceLine={line}
                            updateReferenceLine={updateReferenceLine}
                            removeReferenceLine={removeReferenceLine}
                        />
                    );
                })}
            <Button
                sx={{
                    alignSelf: 'start',
                }}
                variant="subtle"
                compact
                leftIcon={<MantineIcon icon={IconPlus} />}
                onClick={addReferenceLine}
            >
                Add
            </Button>
        </Stack>
    );
};
