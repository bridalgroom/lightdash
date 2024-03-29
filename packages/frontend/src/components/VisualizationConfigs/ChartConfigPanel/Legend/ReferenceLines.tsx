import {
    fieldId as getFieldId,
    isField,
    type CompiledDimension,
    type CustomDimension,
    type Field,
    type Series,
    type TableCalculation,
} from '@lightdash/common';
import { Accordion } from '@mantine/core';
import {
    useCallback,
    useMemo,
    useState,
    type FC,
    type SetStateAction,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useProject } from '../../../../hooks/useProject';
import { type ReferenceLineField } from '../../../common/ReferenceLine';
import { isCartesianVisualizationConfig } from '../../../LightdashVisualization/VisualizationConfigCartesian';
import { useVisualizationContext } from '../../../LightdashVisualization/VisualizationProvider';
import { Config } from '../../common/Config';
import { AddButton } from '../FieldLayoutOptions';
import { ReferenceLine } from './ReferenceLine';

type Props = {
    items: (Field | TableCalculation | CompiledDimension | CustomDimension)[];
    projectUuid: string;
};

export const ReferenceLines: FC<Props> = ({ items, projectUuid }) => {
    const [openItems, setOpenItems] = useState<string[]>([]);

    const handleAccordionChange = (itemValues: SetStateAction<string[]>) => {
        setOpenItems(itemValues);
    };

    const addNewItem = useCallback(
        (index: string) => {
            console.log('onAddNewItem', index);

            const newOpenItems = [...openItems, index];
            setOpenItems(newOpenItems);
        },
        [openItems],
    );
    const removeItem = (index: string) => {
        const newOpenItems = openItems.filter((item) => item !== index);
        setOpenItems(newOpenItems);
    };

    const { visualizationConfig } = useVisualizationContext();
    const isCartesianChart =
        isCartesianVisualizationConfig(visualizationConfig);

    const project = useProject(projectUuid);
    const startOfWeek = useMemo(
        () => project.data?.warehouseConnection?.startOfWeek,
        [project],
    );
    const updateReferenceLine = useCallback(
        (
            updateValue: string,
            updateField:
                | Field
                | TableCalculation
                | CompiledDimension
                | CustomDimension,
            updateLabel: string | undefined,
            updateColor: string,
            lineId: string,
        ) => {
            if (!isCartesianChart) return;

            const {
                dirtyEchartsConfig,
                dirtyLayout,
                referenceLines,
                setReferenceLines,
            } = visualizationConfig.chartConfig;

            if (updateValue && updateField) {
                const fieldId = isField(updateField)
                    ? getFieldId(updateField)
                    : updateField.name;

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
                        name: updateLabel || 'Reference line',
                        value: lineId,
                        lineStyle: { color: updateColor },
                        label: updateLabel ? { formatter: updateLabel } : {},
                        xAxis: undefined,
                        yAxis: undefined,
                        [dirtyLayout?.xField === fieldId ? 'xAxis' : 'yAxis']:
                            updateValue,
                    };

                    const updatedReferenceLines: ReferenceLineField[] =
                        referenceLines.map((line) => {
                            // Check both .value and .name for backwards compatibility
                            if (
                                line.data.value === lineId ||
                                line.data.name === lineId
                            )
                                return { fieldId: fieldId, data: dataWithAxis };
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
                name: 'Reference line',
                value: uuidv4(),
            },
        };
        setReferenceLines([...referenceLines, newReferenceLine]);
        addNewItem(newReferenceLine.data.value);
    }, [addNewItem, isCartesianChart, visualizationConfig.chartConfig]);

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
                        line.data.value !== markLineId &&
                        line.data.name !== markLineId,
                ),
            );
        },
        [isCartesianChart, visualizationConfig],
    );

    if (!isCartesianChart) return null;

    const { referenceLines } = visualizationConfig.chartConfig;

    console.log({ referenceLines });

    return (
        <Config>
            <Config.Group>
                <Config.LabelGroup>
                    <Config.Label>Reference lines</Config.Label>
                    <AddButton onClick={addReferenceLine} />
                </Config.LabelGroup>

                {referenceLines && (
                    <Accordion
                        multiple
                        variant="contained"
                        value={openItems}
                        onChange={handleAccordionChange}
                        styles={(theme) => ({
                            control: {
                                padding: theme.spacing.xs,
                            },
                            label: {
                                padding: 0,
                            },
                            panel: {
                                padding: 0,
                            },
                        })}
                    >
                        {referenceLines.map((line, index) => (
                            <ReferenceLine
                                isOpen={openItems.includes(`Line ${index + 1}`)}
                                addNewItem={addNewItem}
                                removeItem={removeItem}
                                key={line.data.value}
                                index={index + 1}
                                isDefaultOpen={referenceLines.length <= 1}
                                items={items}
                                startOfWeek={startOfWeek ?? undefined}
                                referenceLine={line}
                                updateReferenceLine={updateReferenceLine}
                                removeReferenceLine={removeReferenceLine}
                            />
                        ))}
                    </Accordion>
                )}
            </Config.Group>
        </Config>
    );
};
