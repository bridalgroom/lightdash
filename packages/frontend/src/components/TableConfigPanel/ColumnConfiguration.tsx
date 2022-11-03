import { Button, Colors, Icon, InputGroup } from '@blueprintjs/core';
import React from 'react';
import { useVisualizationContext } from '../LightdashVisualization/VisualizationProvider';
import {
    ColumnConfigurationWrapper,
    ColumnWrapper,
    FrozenIcon,
} from './ColumnConfiguration.styles';

export const ColumnConfiguration: React.FC = () => {
    const {
        pivotDimensions,
        tableConfig: {
            selectedItemIds,
            updateColumnProperty,
            getHeader,
            getDefaultColumnLabel,
            isColumnVisible,
            isColumnFrozen,
        },
    } = useVisualizationContext();
    return (
        <ColumnConfigurationWrapper>
            {selectedItemIds?.map((fieldId) => {
                return (
                    <ColumnWrapper key={fieldId}>
                        <InputGroup
                            fill
                            disabled={!isColumnVisible(fieldId)}
                            defaultValue={getHeader(fieldId)}
                            placeholder={getDefaultColumnLabel(fieldId)}
                            onBlur={(e) => {
                                updateColumnProperty(fieldId, {
                                    name: e.currentTarget.value,
                                });
                            }}
                        />
                        {pivotDimensions === undefined && (
                            <FrozenIcon
                                icon={
                                    isColumnFrozen(fieldId) ? 'lock' : 'unlock'
                                }
                                color={
                                    isColumnFrozen(fieldId)
                                        ? 'black'
                                        : Colors.GRAY5
                                }
                                onClick={() => {
                                    updateColumnProperty(fieldId, {
                                        frozen: !isColumnFrozen(fieldId),
                                    });
                                }}
                            />
                        )}
                        {!pivotDimensions ||
                            (!pivotDimensions.includes(fieldId) && (
                                <Button
                                    icon={
                                        isColumnVisible(fieldId)
                                            ? 'eye-off'
                                            : 'eye-open'
                                    }
                                    onClick={() => {
                                        updateColumnProperty(fieldId, {
                                            visible: !isColumnVisible(fieldId),
                                        });
                                    }}
                                />
                            ))}
                    </ColumnWrapper>
                );
            })}
        </ColumnConfigurationWrapper>
    );
};

export default ColumnConfiguration;
