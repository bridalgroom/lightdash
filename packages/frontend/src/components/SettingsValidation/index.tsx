import { ValidationResponse } from '@lightdash/common';
import {
    Button,
    clsx,
    Flex,
    Group,
    Paper,
    Table,
    Text,
    useMantineTheme,
} from '@mantine/core';
import {
    IconChartBar,
    IconLayoutDashboard,
    IconTable,
} from '@tabler/icons-react';
import { FC } from 'react';
import { useTableStyles } from '../../hooks/styles/useTableStyles';
import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useValidation } from '../../hooks/validation/useValidation';
import { IconBox } from '../common/ResourceView/ResourceIcon';

const UpdatedAtAndBy: FC<
    Required<Pick<ValidationResponse, 'lastUpdatedAt' | 'lastUpdatedBy'>>
> = ({ lastUpdatedAt, lastUpdatedBy }) => {
    const timeAgo = useTimeAgo(lastUpdatedAt);

    return (
        <>
            <Text fw={500}>{timeAgo}</Text>
            <Text color="gray.6">by {lastUpdatedBy}</Text>
        </>
    );
};

export const SettingsValidation: FC<{ projectUuid: string }> = ({
    projectUuid,
}) => {
    const { classes } = useTableStyles();
    const theme = useMantineTheme();

    const { data, isSuccess } = useValidation(projectUuid);

    console.log(data);

    // TODO: get last time validation was run
    // TODO: add mutation to create validation

    const Icon = ({
        validationError,
    }: {
        validationError: ValidationResponse;
    }) => {
        if (validationError.chartUuid)
            return <IconBox icon={IconChartBar} color="blue.8" />;
        if (validationError.dashboardUuid)
            return <IconBox icon={IconLayoutDashboard} color="green.8" />;
        return <IconBox icon={IconTable} color="indigo.6" />;
    };

    return (
        <>
            {isSuccess && (
                <Paper withBorder sx={{ overflow: 'hidden' }}>
                    <Group
                        position="apart"
                        p="md"
                        sx={{
                            borderBottomWidth: 1,
                            borderBottomStyle: 'solid',
                            borderBottomColor: theme.colors.gray[3],
                        }}
                    >
                        <Text fw={500} fz="xs" c="gray.6">
                            {!!data?.length
                                ? `Last validated at: ${data[0].createdAt}`
                                : null}
                        </Text>
                        <Button
                        // TODO: add onClick
                        // TODO: add loading state
                        // TODO: add disabled state
                        // TODO: add error state
                        >
                            Run validation
                        </Button>
                    </Group>

                    <Table
                        className={clsx(classes.root, classes.smallHeaderText)}
                        highlightOnHover
                    >
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Error</th>
                                <th>Last updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.map((validationError) => (
                                <tr key={validationError.name}>
                                    <td>
                                        <Flex gap="sm" align="center">
                                            <Icon
                                                validationError={
                                                    validationError
                                                }
                                            />

                                            <Text fw={600}>
                                                {validationError.name}
                                            </Text>
                                        </Flex>
                                    </td>
                                    <td>
                                        <Text color="gray.8" fw={500}>
                                            {validationError.error}
                                        </Text>
                                    </td>
                                    <td>
                                        {validationError.lastUpdatedAt &&
                                        validationError.lastUpdatedBy ? (
                                            <UpdatedAtAndBy
                                                lastUpdatedAt={
                                                    validationError.lastUpdatedAt
                                                }
                                                lastUpdatedBy={
                                                    validationError.lastUpdatedBy
                                                }
                                            />
                                        ) : (
                                            <Text fw={500}>N/A</Text>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Paper>
            )}
        </>
    );
};
