import { Button, InputGroup } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import { ChartType } from 'common';
import React, { useState } from 'react';
import useBigNumberConfig from '../../hooks/useBigNumberConfig';
import { useVisualizationContext } from '../LightdashVisualization/VisualizationProvider';
import { InputWrapper } from './BigNumberConfig.styles';

export const BigNumberConfigPanel: React.FC = () => {
    const { chartType, plotData, resultsData, explore } =
        useVisualizationContext();
    const { bigNumberLabel } = useBigNumberConfig(resultsData, explore);
    const disabled = !plotData || chartType === ChartType.TABLE;

    const [isOpen, setIsOpen] = useState(false);
    return (
        <Popover2
            content={
                <InputWrapper label="Label">
                    <InputGroup
                        placeholder="Enter label"
                        defaultValue={bigNumberLabel}
                        // onBlur={(e) => setName(0, e.currentTarget.value)}
                    />
                </InputWrapper>
            }
            interactionKind="click"
            isOpen={isOpen}
            onInteraction={setIsOpen}
            position="bottom"
            lazy={false}
            disabled={disabled}
        >
            <Button
                minimal
                rightIcon="caret-down"
                text="Configure"
                disabled={disabled}
            />
        </Popover2>
    );
};

export default BigNumberConfigPanel;
