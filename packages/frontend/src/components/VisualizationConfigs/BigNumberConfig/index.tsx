import { Box, Button, Popover } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import React from 'react';
import {
    COLLAPSABLE_CARD_BUTTON_PROPS,
    COLLAPSABLE_CARD_POPOVER_PROPS,
} from '../../../constants';
import MantineIcon from '../../common/MantineIcon';
import { isBigNumberVisualizationConfig } from '../../LightdashVisualization/utils';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider/useVisualizationContext';
import BigNumberConfigTabs from './BigNumberConfigTabs';

const BigNumberConfig: React.FC = () => {
    const { visualizationConfig } = useVisualizationContext();

    if (!isBigNumberVisualizationConfig(visualizationConfig)) return null;

    const disabled = !visualizationConfig.chartConfig.selectedField;

    return (
        <Popover {...COLLAPSABLE_CARD_POPOVER_PROPS} disabled={disabled}>
            <Popover.Target>
                <Button
                    {...COLLAPSABLE_CARD_BUTTON_PROPS}
                    disabled={disabled}
                    rightIcon={
                        <MantineIcon icon={IconChevronDown} color="gray" />
                    }
                >
                    Configure
                </Button>
            </Popover.Target>

            <Popover.Dropdown>
                <Box w={320}>
                    <BigNumberConfigTabs />
                </Box>
            </Popover.Dropdown>
        </Popover>
    );
};

export default BigNumberConfig;
