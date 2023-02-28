import {
    Box,
    Divider,
    Flex,
    Group,
    Paper,
    Text,
    useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useHover } from '@mantine/hooks';
import { IconEye } from '@tabler/icons-react';
import { FC } from 'react';
import ResourceViewItemActionMenu, {
    ResourceViewItemActionMenuCommonProps,
} from '../ResourceActionMenu';
import ResourceIcon from '../ResourceIcon';
import { ResourceViewDashboardItem } from '../resourceTypeUtils';

interface ResourceViewGridDashboardItemProps
    extends Pick<ResourceViewItemActionMenuCommonProps, 'onAction'> {
    item: ResourceViewDashboardItem;
}

const ResourceViewGridDashboardItem: FC<ResourceViewGridDashboardItemProps> = ({
    item,
    onAction,
}) => {
    const { hovered, ref } = useHover();
    const [opened, handlers] = useDisclosure(false);
    const theme = useMantineTheme();

    return (
        <Paper
            ref={ref}
            component={Flex}
            direction="column"
            p={0}
            withBorder
            bg={hovered ? 'gray.0' : undefined}
            h="100%"
        >
            <Group
                p="md"
                align="center"
                spacing="md"
                noWrap
                sx={{ flexGrow: 1 }}
            >
                <ResourceIcon item={item} />

                <Text lineClamp={2} fz="sm" fw={600}>
                    {item.data.name}
                </Text>
            </Group>

            <Divider color="gray.3" />

            <Flex pl="md" pr="xs" h={32} justify="space-between" align="center">
                <Flex align="center" gap={4}>
                    <IconEye color={theme.colors.gray[6]} size={14} />

                    <Text size={14} color="gray.6" fz="xs">
                        {item.data.views} views
                    </Text>
                </Flex>

                <Box
                    sx={{
                        flexGrow: 0,
                        flexShrink: 0,
                        transition: 'opacity 0.2s',
                        opacity: hovered || opened ? 1 : 0,
                    }}
                    component="div"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                >
                    <ResourceViewItemActionMenu
                        item={item}
                        isOpen={opened}
                        onAction={(action) => {
                            onAction(action);
                            handlers.close();
                        }}
                        onToggle={() => handlers.toggle()}
                    />
                </Box>
            </Flex>
        </Paper>
    );
};

export default ResourceViewGridDashboardItem;
