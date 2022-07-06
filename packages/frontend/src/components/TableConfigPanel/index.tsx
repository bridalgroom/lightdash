import { Button, Switch } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import React, { useState } from 'react';
import { useVisualizationContext } from '../LightdashVisualization/VisualizationProvider';
import ColumnConfiguration from './ColumnConfiguration';
import { ConfigLabel, ConfigWrapper } from './TableConfig.styles';

export const TableConfigPanel: React.FC = () => {
    const {
        tableConfig: { showTableNames, setShowTableName },
    } = useVisualizationContext();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover2
            content={
                <ConfigWrapper>
                    <ConfigLabel>Show table names</ConfigLabel>
                    <Switch
                        large
                        innerLabelChecked="Yes"
                        innerLabel="No"
                        checked={showTableNames}
                        onChange={(e) => {
                            setShowTableName(!showTableNames);
                        }}
                    />
                    <ConfigLabel>Columns</ConfigLabel>

                    <ColumnConfiguration />
                </ConfigWrapper>
            }
            interactionKind="click"
            isOpen={isOpen}
            onInteraction={setIsOpen}
            position="bottom"
            lazy={false}
        >
            <Button minimal rightIcon="caret-down" text="Configure" />
        </Popover2>
    );
};

export default TableConfigPanel;
