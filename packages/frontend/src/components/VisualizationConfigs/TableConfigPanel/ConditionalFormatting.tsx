import {
    assertUnreachable,
    ConditionalFormattingConfig,
    ConditionalFormattingConfigType,
    ConditionalFormattingConfigWithColorRange,
    ConditionalFormattingWithConditionalOperator,
    ConditionalOperator,
    createConditionalFormatingRule,
    createConditionalFormattingConfigWithColorRange,
    createConditionalFormattingConfigWithSingleColor,
    ECHARTS_DEFAULT_COLORS,
    FilterableItem,
    getConditionalFormattingConfigType,
    getItemId,
    isConditionalFormattingConfigWithColorRange,
    isConditionalFormattingConfigWithSingleColor,
} from '@lightdash/common';
import {
    ActionIcon,
    Button,
    Collapse,
    ColorInput,
    Group,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronUp,
    IconPlus,
    IconX,
} from '@tabler/icons-react';
import produce from 'immer';
import React, { FC, useMemo, useState } from 'react';
import { useOrganization } from '../../../hooks/organization/useOrganization';
import FieldIcon from '../../common/Filters/FieldIcon';
import { fieldLabelText } from '../../common/Filters/FieldLabel';
import { FiltersProvider } from '../../common/Filters/FiltersProvider';
import MantineIcon from '../../common/MantineIcon';
import ColorSelector from '../ColorSelector';
import FieldSelectItem from '../FieldSelectItem';
import ConditionalFormattingRule from './ConditionalFormattingRule';

interface ConditionalFormattingProps {
    isDefaultOpen?: boolean;
    index: number;
    fields: FilterableItem[];
    value: ConditionalFormattingConfig;
    onChange: (newConfig: ConditionalFormattingConfig) => void;
    onRemove: () => void;
}

const ConditionalFormattingRuleLabels = {
    [ConditionalFormattingConfigType.Single]: 'Single color',
    [ConditionalFormattingConfigType.Range]: 'Color range',
};

const ConditionalFormatting: FC<ConditionalFormattingProps> = ({
    isDefaultOpen = true,
    index: configIndex,
    fields,
    value,
    onChange,
    onRemove,
}) => {
    const { data: org } = useOrganization();

    const defaultColors = useMemo(
        () => org?.chartColors ?? ECHARTS_DEFAULT_COLORS,
        [org],
    );

    const [isAddingRule, setIsAddingRule] = useState(false);
    const [isOpen, setIsOpen] = useState(isDefaultOpen);
    const [config, setConfig] = useState<ConditionalFormattingConfig>(value);

    const field = useMemo(
        () => fields.find((f) => getItemId(f) === config?.target?.fieldId),
        [fields, config],
    );

    const handleRemove = () => {
        onRemove();
    };

    const handleChange = (newConfig: ConditionalFormattingConfig) => {
        setConfig(newConfig);
        onChange(newConfig);
    };

    const handleChangeField = (newFieldId: string) => {
        handleChange(
            produce(config, (draft) => {
                draft.target = newFieldId ? { fieldId: newFieldId } : null;
            }),
        );
    };

    const handleConfigTypeChange = (
        newConfigType: ConditionalFormattingConfigType,
    ) => {
        switch (newConfigType) {
            case ConditionalFormattingConfigType.Single:
                return handleChange(
                    createConditionalFormattingConfigWithSingleColor(),
                );
            case ConditionalFormattingConfigType.Range:
                return handleChange(
                    createConditionalFormattingConfigWithColorRange(),
                );
            default:
                return assertUnreachable(newConfigType, 'Unknown config type');
        }
    };

    const handleAddRule = () => {
        setIsAddingRule(true);

        if (isConditionalFormattingConfigWithSingleColor(config)) {
            handleChange(
                produce(config, (draft) => {
                    draft.rules.push(createConditionalFormatingRule());
                }),
            );
        }
    };

    const handleRemoveRule = (index: number) => {
        if (isConditionalFormattingConfigWithSingleColor(config)) {
            handleChange(
                produce(config, (draft) => {
                    draft.rules.splice(index, 1);
                }),
            );
        }
    };

    const handleChangeRuleOperator = (
        index: number,
        newOperator: ConditionalOperator,
    ) => {
        if (isConditionalFormattingConfigWithSingleColor(config)) {
            handleChange(
                produce(config, (draft) => {
                    draft.rules[index] = {
                        ...draft.rules[index],
                        operator: newOperator,
                    };
                }),
            );
        }
    };

    const handleChangeRule = (
        index: number,
        newRule: ConditionalFormattingWithConditionalOperator,
    ) => {
        if (isConditionalFormattingConfigWithSingleColor(config)) {
            handleChange(
                produce(config, (draft) => {
                    // FIXME: check if we can fix this problem in number input
                    draft.rules[index] = {
                        ...newRule,
                        values: newRule.values.map((v) => Number(v)),
                    };
                }),
            );
        }
    };

    const handleChangeSingleColor = (newColor: string) => {
        if (isConditionalFormattingConfigWithSingleColor(config)) {
            handleChange(
                produce(config, (draft) => {
                    draft.color = newColor;
                }),
            );
        }
    };

    const handleChangeColorRangeColor = (
        newColor: Partial<ConditionalFormattingConfigWithColorRange['color']>,
    ) => {
        if (isConditionalFormattingConfigWithColorRange(config)) {
            handleChange(
                produce(config, (draft) => {
                    draft.color = {
                        ...draft.color,
                        ...newColor,
                    };
                }),
            );
        }
    };

    const handleChangeColorRangeRule = (
        newRule: Partial<ConditionalFormattingConfigWithColorRange['rule']>,
    ) => {
        if (isConditionalFormattingConfigWithColorRange(config)) {
            handleChange(
                produce(config, (draft) => {
                    draft.rule = {
                        ...draft.rule,
                        ...newRule,
                    };
                }),
            );
        }
    };

    return (
        <FiltersProvider>
            <Stack spacing="xs">
                <Group noWrap position="apart">
                    <Group spacing="xs">
                        <ActionIcon
                            onClick={() => setIsOpen(!isOpen)}
                            size="sm"
                        >
                            <MantineIcon
                                icon={isOpen ? IconChevronUp : IconChevronDown}
                            />
                        </ActionIcon>

                        <Text fw={500}>Rule {configIndex + 1}</Text>
                    </Group>

                    <Tooltip label="Remove rule" position="left">
                        <ActionIcon onClick={handleRemove} size="sm">
                            <MantineIcon icon={IconX} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
                <Collapse in={isOpen}>
                    <Stack
                        bg={'gray.0'}
                        p="sm"
                        spacing="sm"
                        sx={(theme) => ({
                            borderRadius: theme.radius.sm,
                        })}
                    >
                        <Select
                            label="Select field"
                            placeholder="Search field..."
                            searchable
                            clearable
                            icon={field && <FieldIcon item={field} />}
                            value={field ? getItemId(field) : ''}
                            data={fields.map((f) => {
                                const id = getItemId(f);
                                return {
                                    item: f,
                                    value: id,
                                    label: fieldLabelText(f),
                                    disabled:
                                        id === (field && getItemId(field)),
                                };
                            })}
                            itemComponent={FieldSelectItem}
                            onChange={handleChangeField}
                        />

                        <Select
                            value={getConditionalFormattingConfigType(config)}
                            data={[
                                {
                                    value: ConditionalFormattingConfigType.Single,
                                    label: ConditionalFormattingRuleLabels[
                                        ConditionalFormattingConfigType.Single
                                    ],
                                },
                                {
                                    value: ConditionalFormattingConfigType.Range,
                                    label: ConditionalFormattingRuleLabels[
                                        ConditionalFormattingConfigType.Range
                                    ],
                                },
                            ]}
                            onChange={(
                                newConfigType: ConditionalFormattingConfigType,
                            ) => {
                                handleConfigTypeChange(newConfigType);
                            }}
                        />

                        {isConditionalFormattingConfigWithSingleColor(
                            config,
                        ) ? (
                            <>
                                <Group spacing="xs">
                                    <Text fw={500}>Select color</Text>
                                </Group>

                                <ColorSelector
                                    color={config.color}
                                    onColorChange={handleChangeSingleColor}
                                />

                                {config.rules.map((rule, ruleIndex) => (
                                    <React.Fragment key={ruleIndex}>
                                        <ConditionalFormattingRule
                                            isDefaultOpen={
                                                config.rules.length === 1 ||
                                                isAddingRule
                                            }
                                            hasRemove={config.rules.length > 1}
                                            ruleIndex={ruleIndex}
                                            rule={rule}
                                            field={field || fields[0]}
                                            onChangeRule={(newRule) =>
                                                handleChangeRule(
                                                    ruleIndex,
                                                    newRule,
                                                )
                                            }
                                            onChangeRuleOperator={(
                                                newOperator,
                                            ) =>
                                                handleChangeRuleOperator(
                                                    ruleIndex,
                                                    newOperator,
                                                )
                                            }
                                            onRemoveRule={() =>
                                                handleRemoveRule(ruleIndex)
                                            }
                                        />

                                        {ruleIndex !==
                                            config.rules.length - 1 && (
                                            <Text fz="xs" fw={600}>
                                                AND
                                            </Text>
                                        )}
                                    </React.Fragment>
                                ))}
                            </>
                        ) : isConditionalFormattingConfigWithColorRange(
                              config,
                          ) ? (
                            <>
                                <SimpleGrid cols={2}>
                                    <ColorInput
                                        withEyeDropper={false}
                                        format="hex"
                                        swatches={defaultColors}
                                        swatchesPerRow={defaultColors.length}
                                        label="Start color"
                                        value={config.color.start}
                                        onChange={(newStartColor) =>
                                            handleChangeColorRangeColor({
                                                start: newStartColor,
                                            })
                                        }
                                    />

                                    <ColorInput
                                        withEyeDropper={false}
                                        format="hex"
                                        swatches={defaultColors}
                                        swatchesPerRow={defaultColors.length}
                                        label="End color"
                                        value={config.color.end}
                                        onChange={(newEndColor) =>
                                            handleChangeColorRangeColor({
                                                end: newEndColor,
                                            })
                                        }
                                    />

                                    <NumberInput
                                        label="Min value"
                                        value={config.rule.min}
                                        onChange={(newMin) => {
                                            if (newMin === '') return;

                                            handleChangeColorRangeRule({
                                                min: newMin,
                                            });
                                        }}
                                    />

                                    <NumberInput
                                        label="Max value"
                                        value={config.rule.max}
                                        onChange={(newMax) => {
                                            if (newMax === '') return;

                                            handleChangeColorRangeRule({
                                                max: newMax,
                                            });
                                        }}
                                    />
                                </SimpleGrid>
                            </>
                        ) : (
                            assertUnreachable(config, 'Unknown config type')
                        )}

                        <Button
                            sx={{ alignSelf: 'start' }}
                            size="xs"
                            variant="subtle"
                            leftIcon={<MantineIcon icon={IconPlus} />}
                            onClick={handleAddRule}
                        >
                            Add new condition
                        </Button>
                    </Stack>
                </Collapse>
            </Stack>
        </FiltersProvider>
    );
};
export default ConditionalFormatting;
