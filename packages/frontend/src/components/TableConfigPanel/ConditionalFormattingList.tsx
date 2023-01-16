import { Button, Classes, FormGroup } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import {
    createConditionalFormattingConfig,
    fieldId,
    getVisibleFields,
} from '@lightdash/common';
import produce from 'immer';
import { useCallback, useMemo, useState } from 'react';
import { useExplorerContext } from '../../providers/ExplorerProvider';
import { useVisualizationContext } from '../LightdashVisualization/VisualizationProvider';
import ConditionalFormatting from './ConditionalFormatting';
import { ConditionalFormattingListWrapper } from './ConditionalFormatting.styles';

const ConditionalFormattingList = ({}) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const {
        explore,
        tableConfig: { conditionalFormattings, onSetConditionalFormattings },
    } = useVisualizationContext();

    const activeFields = useExplorerContext((c) => c.state.activeFields);

    const visibleActiveNumericFields = useMemo(() => {
        if (!explore) return [];

        return getVisibleFields(explore)
            .filter((field) => activeFields.has(fieldId(field)))
            .filter((field) => field.type === 'number');
    }, [explore, activeFields]);

    const activeConfigs = useMemo(() => {
        return conditionalFormattings.filter((config) =>
            config.target
                ? visibleActiveNumericFields.find(
                      (field) => fieldId(field) === config.target?.fieldId,
                  )
                : true,
        );
    }, [conditionalFormattings, visibleActiveNumericFields]);

    const usedFieldIds = useMemo(() => {
        return activeConfigs
            .map((c) => c.target?.fieldId)
            .filter((f): f is string => !!f);
    }, [activeConfigs]);

    const handleAdd = useCallback(() => {
        setIsAddingNew(true);
        onSetConditionalFormattings(
            produce(activeConfigs, (draft) => {
                draft.push(createConditionalFormattingConfig());
            }),
        );
    }, [onSetConditionalFormattings, activeConfigs]);

    const handleRemove = useCallback(
        (index) =>
            onSetConditionalFormattings(
                produce(activeConfigs, (draft) => {
                    draft.splice(index, 1);
                }),
            ),
        [onSetConditionalFormattings, activeConfigs],
    );

    const handleChange = useCallback(
        (index, newConfig) =>
            onSetConditionalFormattings(
                produce(activeConfigs, (draft) => {
                    draft[index] = newConfig;
                }),
            ),
        [onSetConditionalFormattings, activeConfigs],
    );

    const isAddButtonDisabled = useMemo(
        () => visibleActiveNumericFields.length === usedFieldIds.length,
        [visibleActiveNumericFields, usedFieldIds],
    );

    return (
        <ConditionalFormattingListWrapper>
            {activeConfigs.map((conditionalFormatting, index) => (
                <ConditionalFormatting
                    key={index}
                    isDefaultOpen={activeConfigs.length === 1 || isAddingNew}
                    index={index}
                    fields={visibleActiveNumericFields}
                    usedFieldIds={usedFieldIds}
                    value={conditionalFormatting}
                    onChange={(newConfig) => handleChange(index, newConfig)}
                    onRemove={() => handleRemove(index)}
                />
            ))}

            <FormGroup>
                <Tooltip2
                    position="bottom-left"
                    disabled={!isAddButtonDisabled}
                    content="All fields are already being used in rules."
                >
                    <Button
                        icon="plus"
                        onClick={isAddButtonDisabled ? undefined : handleAdd}
                        className={
                            isAddButtonDisabled ? Classes.DISABLED : undefined
                        }
                    >
                        Add new rule
                    </Button>
                </Tooltip2>
            </FormGroup>
        </ConditionalFormattingListWrapper>
    );
};

export default ConditionalFormattingList;
