import { AdditionalMetric, CompiledTable } from '@lightdash/common';
import { Group, MantineProvider, NavLink, Text, Tooltip } from '@mantine/core';
import { IconTable } from '@tabler/icons-react';
import { FC } from 'react';
import { useToggle } from 'react-use';

import { getMantineThemeOverride } from '../../../../mantineTheme';
import { TrackSection } from '../../../../providers/TrackingProvider';
import { SectionName } from '../../../../types/Events';
import MantineIcon from '../../../common/MantineIcon';
import TableTreeSections from './TableTreeSections';

type TableTreeWrapperProps = {
    table: CompiledTable;
};

const TableTreeWrapper: FC<TableTreeWrapperProps> = ({ table, children }) => {
    const [isOpen, toggle] = useToggle(true);
    return (
        <NavLink
            opened={isOpen}
            onChange={toggle}
            icon={<MantineIcon icon={IconTable} size="lg" color="gray.7" />}
            label={
                <Tooltip
                    label={table.description}
                    position="top-start"
                    withinPortal
                    maw={350}
                    multiline
                    sx={{ whiteSpace: 'normal' }}
                >
                    <Group>
                        <Text truncate fw={600}>
                            {table.label}
                        </Text>
                    </Group>
                </Tooltip>
            }
            styles={{
                root: {
                    top: 0,
                    position: 'sticky',
                    backgroundColor: 'white',
                },
            }}
        >
            {children}
        </NavLink>
    );
};

type Props = {
    searchQuery?: string;
    showTableLabel: boolean;
    table: CompiledTable;
    additionalMetrics: AdditionalMetric[];
    selectedItems: Set<string>;
    onSelectedNodeChange: (itemId: string, isDimension: boolean) => void;
};

const EmptyWrapper: FC = ({ children }) => <>{children}</>;

const themeOverride = getMantineThemeOverride({
    components: {
        NavLink: {
            styles: (theme, _params) => ({
                root: {
                    height: theme.spacing.xxl,
                    padding: `0 ${theme.spacing.sm}`,
                    flexGrow: 0,
                },
                rightSection: {
                    marginLeft: theme.spacing.xxs,
                },
            }),
        },
    },
});

const TableTree: FC<Props> = ({
    showTableLabel,
    table,
    additionalMetrics,
    ...rest
}) => {
    const Wrapper = showTableLabel ? TableTreeWrapper : EmptyWrapper;

    return (
        <TrackSection name={SectionName.SIDEBAR}>
            <MantineProvider inherit theme={themeOverride}>
                <Wrapper table={table}>
                    <TableTreeSections
                        table={table}
                        additionalMetrics={additionalMetrics}
                        {...rest}
                    />
                </Wrapper>
            </MantineProvider>
        </TrackSection>
    );
};

export default TableTree;
