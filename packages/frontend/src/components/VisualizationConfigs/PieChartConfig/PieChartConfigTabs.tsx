import { Accordion } from '@mantine/core';
import { memo, type FC } from 'react';
import { getAccordionConfigTabsStyles } from '../mantineTheme';
import { Display } from './PieChartDisplayConfig';
import { Layout } from './PieChartLayoutConfig';
import { Series } from './PieChartSeriesConfig';

export const ConfigTabs: FC = memo(() => {
    return (
        <Accordion
            radius="none"
            styles={getAccordionConfigTabsStyles}
            defaultValue="layout"
        >
            <Accordion.Item value="layout">
                <Accordion.Control>Layout</Accordion.Control>
                <Accordion.Panel>
                    <Layout />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="series">
                <Accordion.Control>Series</Accordion.Control>
                <Accordion.Panel>
                    <Series />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="display">
                <Accordion.Control>Display</Accordion.Control>
                <Accordion.Panel>
                    <Display />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
});
