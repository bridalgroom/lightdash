import { MantineProvider, Tabs } from '@mantine/core';
import React, { memo } from 'react';
import { themeOverride } from '../mantineTheme';
import PieChartDisplayConfig from './PieChartDisplayConfig';
import PieChartLayoutConfig from './PieChartLayoutConfig';
import PieChartSeriesConfig from './PieChartSeriesConfig';

export const ConfigTabs: React.FC = memo(() => {
    return (
        <MantineProvider inherit theme={themeOverride}>
            <Tabs defaultValue="layout" keepMounted={false}>
                <Tabs.List mb="sm">
                    <Tabs.Tab px="sm" value="layout">
                        Layout
                    </Tabs.Tab>
                    <Tabs.Tab px="sm" value="series">
                        Series
                    </Tabs.Tab>
                    <Tabs.Tab px="sm" value="display">
                        Display
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="layout">
                    <PieChartLayoutConfig />
                </Tabs.Panel>

                <Tabs.Panel value="series">
                    <PieChartSeriesConfig />
                </Tabs.Panel>

                <Tabs.Panel value="display">
                    <PieChartDisplayConfig />
                </Tabs.Panel>
            </Tabs>
        </MantineProvider>
    );
});
