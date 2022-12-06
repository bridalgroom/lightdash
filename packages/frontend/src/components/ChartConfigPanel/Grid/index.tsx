import { Button, FormGroup, InputGroup } from '@blueprintjs/core';
import { EchartsGrid } from '@lightdash/common';
import startCase from 'lodash/startCase';
import { FC, useMemo } from 'react';
import UnitInput from '../../common/UnitInput';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider';
import { SectionRow } from './Grid.styles';

export const defaultGrid = {
    containLabel: true,
    left: '5%', // small padding
    right: '5%', // small padding
    top: '70px', // pixels from top (makes room for legend)
    bottom: '30px', // pixels from bottom (makes room for x-axis)
};

const positions = ['top', 'bottom', 'left', 'right'] as const;

enum Units {
    Pixels = 'px',
    Percentage = '%',
}

const units = Object.values(Units);

const GridPanel: FC = () => {
    const {
        cartesianConfig: { dirtyEchartsConfig, setGrid },
    } = useVisualizationContext();

    const config = useMemo<EchartsGrid>(
        () => ({
            ...defaultGrid,
            ...dirtyEchartsConfig?.grid,
        }),
        [dirtyEchartsConfig?.grid],
    );

    const handleUpdate = (
        position: typeof positions[number],
        value: string,
        unit: Units = Units.Pixels,
    ) => {
        const newValue = value && value !== '' ? `${value}${unit}` : undefined;

        const newState = { ...config, [position]: newValue };
        setGrid(newState);
        return newState;
    };

    return (
        <SectionRow>
            {positions.map((position) => {
                return (
                    <FormGroup
                        key={position}
                        label={startCase(position)}
                        labelFor={`${position}-input`}
                    >
                        <UnitInput
                            units={units}
                            name={position}
                            value={config[position] || ''}
                            defaultValue={defaultGrid[position]}
                            onChange={(value, unit) =>
                                handleUpdate(position, value, unit)
                            }
                        />
                    </FormGroup>
                );
            })}
        </SectionRow>
    );
};

export default GridPanel;
