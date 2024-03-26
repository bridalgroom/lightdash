import { Group, Stack, Text } from '@mantine/core';
import { type FC, type PropsWithChildren } from 'react';

interface ConfigGroupComponent extends FC<PropsWithChildren> {
    Label: FC<PropsWithChildren>;
    LabelGroup: FC<PropsWithChildren>;
}

export const ConfigGroup: ConfigGroupComponent = ({ children }) => (
    <Stack spacing="xs">{children}</Stack>
);

const Label: FC<PropsWithChildren> = ({ children }) => (
    <Text c="gray.8" fz="sm" fw={500}>
        {children}
    </Text>
);

const LabelGroup: FC<PropsWithChildren> = ({ children }) => (
    <Group position="apart">{children}</Group>
);

ConfigGroup.Label = Label;
ConfigGroup.LabelGroup = LabelGroup;
