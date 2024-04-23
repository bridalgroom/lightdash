import { Accordion } from '@mantine/core';
import { memo, useMemo, type FC } from 'react';
import { useVisualizationContext } from '../../../LightdashVisualization/VisualizationProvider';
import { getAccordionConfigTabsStyles } from '../../mantineTheme';
import { Axes } from '../Axes';
import { Grid } from '../Grid';
import { Layout } from '../Layout';
import { Legend } from '../Legend';
import { ReferenceLines } from '../ReferenceLines/ReferenceLines';
import { Series } from '../Series';

export const ConfigTabs: FC = memo(() => {
    const { itemsMap } = useVisualizationContext();

    const items = useMemo(() => Object.values(itemsMap || {}), [itemsMap]);

    return (
        <Accordion
            radius="none"
            styles={getAccordionConfigTabsStyles}
            defaultValue="layout"
        >
            <Accordion.Item value="layout">
                <Accordion.Control>Layout</Accordion.Control>
                <Accordion.Panel>
                    <Layout items={items} />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="series">
                <Accordion.Control>Series</Accordion.Control>
                <Accordion.Panel>
                    <Series items={items} />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="axes">
                <Accordion.Control>Axes</Accordion.Control>
                <Accordion.Panel>
                    <Axes itemsMap={itemsMap} />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="legend">
                <Accordion.Control>Legend</Accordion.Control>
                <Accordion.Panel>
                    <Legend />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="reference-lines">
                <Accordion.Control>Reference Lines</Accordion.Control>
                <Accordion.Panel>
                    <ReferenceLines items={items} />
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="grid">
                <Accordion.Control>Margin</Accordion.Control>
                <Accordion.Panel>
                    <Grid />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
});
