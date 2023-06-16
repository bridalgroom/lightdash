import {
    AdditionalMetric,
    Dimension,
    friendlyName,
    isAdditionalMetric,
    isDimension,
    MetricFilterRule,
    MetricType,
    snakeCaseName,
} from '@lightdash/common';
import {
    Accordion,
    Button,
    Modal,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useExplore } from '../../../hooks/useExplore';
import { useProject } from '../../../hooks/useProject';
import { useExplorerContext } from '../../../providers/ExplorerProvider';
import { FiltersProvider } from '../../common/Filters/FiltersProvider';
import { useFieldsWithSuggestions } from '../FiltersCard/useFieldsWithSuggestions';
import { FilterForm, MetricFilterRuleWithFieldId } from './FilterForm';
import { addFieldIdToMetricFilterRule } from './utils';

type Props = {
    isEditMode: boolean;
    isCreatingCustomMetric: boolean;
    setIsCreatingCustomMetric: Dispatch<SetStateAction<boolean>>;
    customMetricType: MetricType | undefined;
    item: Dimension | AdditionalMetric;
};

export const CustomMetricModal: FC<Props> = ({
    isEditMode,
    item,
    isCreatingCustomMetric,
    setIsCreatingCustomMetric,
    customMetricType,
}) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const project = useProject(projectUuid);

    const addAdditionalMetric = useExplorerContext(
        (context) => context.actions.addAdditionalMetric,
    );
    const editAdditionalMetric = useExplorerContext(
        (context) => context.actions.editAdditionalMetric,
    );
    const tableName = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );

    const queryResults = useExplorerContext(
        (context) => context.queryResults.data,
    );

    const { data } = useExplore(tableName);

    const additionalMetrics = useExplorerContext(
        (context) =>
            context.state.unsavedChartVersion.metricQuery.additionalMetrics,
    );

    const fieldsWithSuggestions = useFieldsWithSuggestions({
        data,
        queryResults,
        additionalMetrics,
    });

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            customMetricLabel: isEditMode
                ? item.label
                : customMetricType
                ? `${friendlyName(customMetricType)} of ${item.label}`
                : '',
        },
        validate: {
            customMetricLabel: (label) =>
                additionalMetrics?.some(
                    (metric) =>
                        metric.label?.toLowerCase() === label?.toLowerCase(),
                )
                    ? 'Metric with this label already exists'
                    : null,
        },
    });

    const getCurrentCustomMetricFiltersWithIds = useCallback(() => {
        if (isAdditionalMetric(item)) {
            return (
                item.filters?.map((filterRule) =>
                    addFieldIdToMetricFilterRule(filterRule),
                ) || []
            );
        }

        return [];
    }, [item]);

    const [customMetricFiltersWithIds, setCustomMetricFiltersWithIds] =
        useState<MetricFilterRuleWithFieldId[]>(
            isEditMode ? getCurrentCustomMetricFiltersWithIds() : [],
        );

    const createCustomMetric = useCallback(
        (dimension: Dimension | AdditionalMetric, type: MetricType) => {
            const shouldCopyFormatting = [
                MetricType.PERCENTILE,
                MetricType.MEDIAN,
                MetricType.AVERAGE,
                MetricType.SUM,
                MetricType.MIN,
                MetricType.MAX,
            ].includes(type);
            const compact =
                shouldCopyFormatting && dimension.compact
                    ? { compact: dimension.compact }
                    : {};
            const format =
                shouldCopyFormatting && dimension.format
                    ? { format: dimension.format }
                    : {};

            const defaultRound =
                type === MetricType.AVERAGE ? { round: 2 } : {};
            const round =
                shouldCopyFormatting && dimension.round
                    ? { round: dimension.round }
                    : defaultRound;

            const customMetricFilters: MetricFilterRule[] =
                customMetricFiltersWithIds.map(
                    ({
                        target: { fieldId, ...restTarget },
                        ...customMetricFilter
                    }) => ({
                        ...customMetricFilter,
                        target: restTarget,
                    }),
                );

            if (
                isEditMode &&
                isAdditionalMetric(item) &&
                form.values.customMetricLabel &&
                item.baseDimensionName
            ) {
                editAdditionalMetric(
                    {
                        ...item,
                        name: `${item.baseDimensionName}_${snakeCaseName(
                            form.values.customMetricLabel ?? '',
                        )}`,
                        description: `${friendlyName(type)} of ${
                            dimension.label
                        } on the table ${data?.tables[item.table].label} ${
                            customMetricFilters.length > 0
                                ? `with filters ${customMetricFilters
                                      .map((filter) => filter.target.fieldRef)
                                      .join(', ')}`
                                : ''
                        }`,
                        label: form.values.customMetricLabel,
                        sql: dimension.sql,
                        type,
                        ...(customMetricFilters.length > 0 && {
                            filters: customMetricFilters,
                        }),
                        ...format,
                        ...round,
                        ...compact,
                    },
                    `${item.table}_${item.name}`,
                );
            } else if (isDimension(dimension)) {
                addAdditionalMetric({
                    id: uuidv4(),
                    name: `${dimension.name}_${snakeCaseName(
                        form.values.customMetricLabel ?? '',
                    )}`,
                    label: form.values.customMetricLabel,
                    table: dimension.table,
                    sql: dimension.sql,
                    description: `${friendlyName(type)} of ${
                        dimension.label
                    } on the table ${dimension.tableLabel} ${
                        customMetricFilters.length > 0
                            ? `with filters ${customMetricFilters
                                  .map((filter) => filter.target.fieldRef)
                                  .join(', ')}`
                            : ''
                    }`,
                    type,
                    ...(customMetricFilters.length > 0 && {
                        filters: customMetricFilters,
                    }),
                    baseDimensionName: dimension.name,
                    ...format,
                    ...round,
                    ...compact,
                });
            }
            setIsCreatingCustomMetric(false);
        },
        [
            addAdditionalMetric,
            customMetricFiltersWithIds,
            data?.tables,
            editAdditionalMetric,
            form.values.customMetricLabel,
            isEditMode,
            item,
            setIsCreatingCustomMetric,
        ],
    );

    return (
        <Modal
            size="xl"
            centered
            zIndex={15}
            onClick={(e) => e.stopPropagation()}
            opened={isCreatingCustomMetric}
            onClose={() => setIsCreatingCustomMetric(false)}
            title={
                <Title order={4}>
                    {isEditMode ? 'Edit' : 'Create'} Custom Metric
                </Title>
            }
        >
            <Stack>
                <form
                    onSubmit={() => createCustomMetric(item, customMetricType!)}
                >
                    <TextInput
                        label="Label"
                        required
                        placeholder="Enter custom metric label"
                        {...form.getInputProps('customMetricLabel')}
                    />
                    <Accordion chevronPosition="left" chevronSize="xs">
                        <Accordion.Item value="filters">
                            <Accordion.Control>
                                <Text fw={500} fz="sm">
                                    Filters{' '}
                                    <Text span fz="xs" color="gray.5" fw={400}>
                                        (optional)
                                    </Text>
                                </Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <FiltersProvider
                                    projectUuid={projectUuid}
                                    fieldsMap={fieldsWithSuggestions}
                                    startOfWeek={
                                        project.data?.warehouseConnection
                                            ?.startOfWeek
                                    }
                                >
                                    <FilterForm
                                        item={item}
                                        customMetricFiltersWithIds={
                                            customMetricFiltersWithIds
                                        }
                                        setCustomMetricFiltersWithIds={
                                            setCustomMetricFiltersWithIds
                                        }
                                    />
                                </FiltersProvider>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>

                    <Button display="block" ml="auto" type="submit">
                        {isEditMode ? 'Save changes' : 'Create'}
                    </Button>
                </form>
            </Stack>
        </Modal>
    );
};
