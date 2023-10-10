import { CreateSchedulerTarget, SchedulerFormat } from '@lightdash/common';
import {
    Anchor,
    Box,
    Button,
    Checkbox,
    Collapse,
    Group,
    HoverCard,
    Input,
    Loader,
    MultiSelect,
    NumberInput,
    Radio,
    SegmentedControl,
    Space,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import React, { FC, ReactNode, useMemo, useState } from 'react';
import useHealth from '../../../hooks/health/useHealth';

import { useForm } from '@mantine/form';
import {
    IconChevronDown,
    IconChevronUp,
    IconMail,
    IconSettings,
} from '@tabler/icons-react';
import MantineIcon from '../../../components/common/MantineIcon';
import { hasRequiredScopes } from '../../../components/UserSettings/SlackSettingsPanel';
import { useSlackChannels } from '../../../hooks/slack/useSlackChannels';
import { useGetSlack } from '../../../hooks/useSlack';
import { SlackIcon } from './SchedulerModalBase.styles';

export enum Limit {
    TABLE = 'table',
    ALL = 'all',
    CUSTOM = 'custom',
}

export enum Values {
    FORMATTED = 'formatted',
    RAW = 'raw',
}

enum SlackStates {
    LOADING,
    SUCCESS,
    NO_SLACK,
    MISSING_SCOPES,
}

const SlackErrorContent: FC<{ slackState: SlackStates }> = ({
    slackState,
}): JSX.Element => {
    if (slackState === SlackStates.NO_SLACK) {
        return (
            <>
                <Text pb="sm">No Slack integration found</Text>
                <Text>
                    To create a slack scheduled delivery, you need to
                    <Anchor
                        target="_blank"
                        href="https://docs.lightdash.com/self-host/customize-deployment/configure-a-slack-app-for-lightdash"
                    >
                        {' '}
                        setup Slack{' '}
                    </Anchor>
                    for your Lightdash instance
                </Text>
            </>
        );
    } else if (slackState === SlackStates.MISSING_SCOPES) {
        return (
            <>
                <Text pb="sm">Slack integration needs to be reinstalled</Text>
                <Text>
                    To create a slack scheduled delivery, you need to
                    <Anchor href="/generalSettings/integrations/slack">
                        {' '}
                        reinstall the Slack integration{' '}
                    </Anchor>
                    for your organization
                </Text>
            </>
        );
    }
    return <></>;
};

const SchedulerForm2: FC<{
    disabled: boolean;
    onSubmit: (data: any) => void;
    footer: ReactNode;
}> = ({ disabled, onSubmit, footer }) => {
    // TODO: Implement edit mode. In Edit mode these default
    // values should come from the existing schedule
    const form = useForm({
        initialValues: {
            name: '',
            message: '',
            format: SchedulerFormat.CSV,
            cron: '0 9 * * 1',
            options: {
                formatted: Values.FORMATTED,
                limit: Limit.TABLE,
                customLimit: 1,
                withPdf: false,
            },
            emailTargets: [] as string[],
            slackTargets: [] as string[],
        },
        validateInputOnBlur: ['options.customLimit'],

        validate: {
            options: {
                customLimit: (value, values) => {
                    return values.options.limit === Limit.CUSTOM &&
                        !Number.isInteger(value)
                        ? 'Custom limit must be an integer'
                        : null;
                },
            },
        },

        transformValues: (values) => {
            let options;
            if (values.format === SchedulerFormat.CSV) {
                options = {
                    formatted: values.options.formatted,
                    limit:
                        values.options.limit === Limit.CUSTOM
                            ? values.options.customLimit
                            : values.options.limit,
                };
            } else if (values.format === SchedulerFormat.IMAGE) {
                options = {
                    withPdf: values.options.withPdf,
                };
            }

            const emailTargets = values.emailTargets.map((email) => ({
                recipient: email,
            }));

            const slackTargets = values.slackTargets.map((channelId) => ({
                channel: channelId,
            }));

            const targets: CreateSchedulerTarget[] = [
                ...emailTargets,
                ...slackTargets,
            ];
            return {
                name: values.name,
                message: values.message,
                format: values.format,
                cron: values.cron,
                options,
                targets,
            };
        },
    });
    const health = useHealth();
    const [emails, setEmails] = useState<string[]>([]);
    const [privateChannels, setPrivateChannels] = useState<
        Array<{
            label: string;
            value: string;
            group: 'Private channels';
        }>
    >([]);

    const [showFormatting, setShowFormatting] = useState(false);

    const slackQuery = useGetSlack();
    const slackState = useMemo(() => {
        if (slackQuery.isLoading) {
            return SlackStates.LOADING;
        } else {
            if (
                slackQuery.data?.slackTeamName === undefined ||
                slackQuery.isError
            ) {
                return SlackStates.NO_SLACK;
            } else if (slackQuery.data && !hasRequiredScopes(slackQuery.data)) {
                return SlackStates.MISSING_SCOPES;
            }
            return SlackStates.SUCCESS;
        }
    }, [slackQuery]);

    const slackChannelsQuery = useSlackChannels();

    const slackChannels = useMemo(() => {
        return (slackChannelsQuery.data || [])
            .map((channel) => {
                const channelPrefix = channel.name.charAt(0);

                return {
                    value: channel.id,
                    label: channel.name,
                    group:
                        channelPrefix === '#'
                            ? 'Channels'
                            : channelPrefix === '@'
                            ? 'Users'
                            : 'Private channels',
                };
            })
            .concat(privateChannels);
    }, [slackChannelsQuery.data, privateChannels]);

    const isAddSlackDisabled = disabled || slackState !== SlackStates.SUCCESS;
    const isAddEmailDisabled = disabled || !health.data?.hasEmailClient;
    const isImageDisabled = !health.data?.hasHeadlessBrowser;

    const showDestinationLabel =
        form.values?.emailTargets.length + form.values?.slackTargets.length < 1;

    const limit = form.values?.options?.limit;

    return (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
            <Stack
                sx={(theme) => ({
                    backgroundColor: theme.white,
                    paddingRight: theme.spacing.xl,
                })}
                spacing="xl"
                py="sm"
                px="md"
            >
                <TextInput
                    label="Delivery name"
                    placeholder="Name your delivery"
                    required
                    {...form.getInputProps('name')}
                />
                <Input.Wrapper label="Delivery frequency">
                    {/* TODO: Cron inputs */}
                    <TextInput
                        disabled
                        placeholder="Always Monday at 9am for now"
                        mt={3}
                    ></TextInput>
                </Input.Wrapper>
                <Stack spacing={0}>
                    <Input.Label mb="xxs"> Format </Input.Label>
                    <Group spacing="xs" noWrap>
                        <SegmentedControl
                            data={[
                                { label: '.csv', value: SchedulerFormat.CSV },
                                {
                                    label: 'Image',
                                    value: SchedulerFormat.IMAGE,
                                    disabled: isImageDisabled,
                                },
                            ]}
                            w="50%"
                            mb="xs"
                            {...form.getInputProps('format')}
                        />
                        {isImageDisabled && (
                            <Text
                                size="xs"
                                color="gray.6"
                                w="30%"
                                sx={{ alignSelf: 'start' }}
                            >
                                You must enable the
                                <Anchor href="https://docs.lightdash.com/self-host/customize-deployment/enable-headless-browser-for-lightdash">
                                    {' '}
                                    headless browser{' '}
                                </Anchor>
                                to send images
                            </Text>
                        )}
                    </Group>
                    <Space h="xxs" />
                    {form.getInputProps('format').value ===
                    SchedulerFormat.IMAGE ? (
                        <Checkbox
                            h={26}
                            label="Also include image as PDF attachment"
                            labelPosition="left"
                            {...form.getInputProps('options.withPdf', {
                                type: 'checkbox',
                            })}
                        />
                    ) : (
                        <Stack spacing="xs">
                            <Button
                                variant="subtle"
                                compact
                                sx={{
                                    alignSelf: 'start',
                                }}
                                leftIcon={<MantineIcon icon={IconSettings} />}
                                rightIcon={
                                    <MantineIcon
                                        icon={
                                            showFormatting
                                                ? IconChevronUp
                                                : IconChevronDown
                                        }
                                    />
                                }
                                onClick={() => setShowFormatting((old) => !old)}
                            >
                                Formatting options
                            </Button>
                            <Collapse in={showFormatting} pl="md">
                                <Group align="start" spacing="xxl">
                                    <Radio.Group
                                        label="Values"
                                        {...form.getInputProps(
                                            'options.formatted',
                                        )}
                                    >
                                        <Stack spacing="xxs" pt="xs">
                                            <Radio
                                                label="Formatted"
                                                value={Values.FORMATTED}
                                            />
                                            <Radio
                                                label="Raw"
                                                value={Values.RAW}
                                            />
                                        </Stack>
                                    </Radio.Group>
                                    <Stack spacing="xs">
                                        <Radio.Group
                                            label="Limit"
                                            {...form.getInputProps(
                                                'options.limit',
                                            )}
                                        >
                                            <Stack spacing="xxs" pt="xs">
                                                <Radio
                                                    label="Results in Table"
                                                    value={Limit.TABLE}
                                                />
                                                <Radio
                                                    label="All Results"
                                                    value={Limit.ALL}
                                                />
                                                <Radio
                                                    label="Custom..."
                                                    value={Limit.CUSTOM}
                                                />
                                            </Stack>
                                        </Radio.Group>
                                        {limit === Limit.CUSTOM && (
                                            <NumberInput
                                                w={150}
                                                min={1}
                                                precision={0}
                                                required
                                                {...form.getInputProps(
                                                    'options.customLimit',
                                                )}
                                            />
                                        )}

                                        {(form.values?.options?.limit ===
                                            Limit.ALL ||
                                            form.values?.options?.limit ===
                                                Limit.CUSTOM) && (
                                            <i>
                                                Results are limited to{' '}
                                                {Number(
                                                    health.data?.query
                                                        .csvCellsLimit ||
                                                        100000,
                                                ).toLocaleString()}{' '}
                                                cells for each file
                                            </i>
                                        )}
                                    </Stack>
                                </Group>
                            </Collapse>
                        </Stack>
                    )}
                </Stack>

                <Input.Wrapper
                    label="Destinations"
                    description={
                        showDestinationLabel ? 'No destination(s) selected' : ''
                    }
                >
                    <Stack mt="sm">
                        <Group noWrap>
                            <MantineIcon
                                icon={IconMail}
                                size="xl"
                                color="gray.7"
                            />
                            <HoverCard
                                disabled={!isAddEmailDisabled}
                                width={300}
                                position="bottom-start"
                                shadow="md"
                            >
                                <HoverCard.Target>
                                    <Box w="100%">
                                        <MultiSelect
                                            placeholder="Enter email addresses"
                                            data={emails}
                                            value={form.values?.emailTargets}
                                            searchable
                                            creatable
                                            disabled={isAddEmailDisabled}
                                            getCreateLabel={(query) =>
                                                `+ Add ${query}`
                                            }
                                            onCreate={(newItem) => {
                                                setEmails((current) => [
                                                    ...current,
                                                    newItem,
                                                ]);
                                                return newItem;
                                            }}
                                            onChange={(val) => {
                                                form.setFieldValue(
                                                    'emailTargets',
                                                    val,
                                                );
                                            }}
                                            rightSection={<></>}
                                        />
                                    </Box>
                                </HoverCard.Target>
                                <HoverCard.Dropdown>
                                    <>
                                        <Text pb="sm">
                                            No Email integration found
                                        </Text>
                                        <Text>
                                            To create an email scheduled
                                            delivery, you need to add
                                            <Anchor
                                                target="_blank"
                                                href="https://docs.lightdash.com/references/environmentVariables"
                                            >
                                                {' '}
                                                SMTP environment variables{' '}
                                            </Anchor>
                                            for your Lightdash instance
                                        </Text>
                                    </>
                                </HoverCard.Dropdown>
                            </HoverCard>
                        </Group>
                        <Stack spacing="sm">
                            <Group noWrap>
                                <SlackIcon style={{ margin: '5px 2px' }} />
                                <HoverCard
                                    disabled={!isAddSlackDisabled}
                                    width={300}
                                    position="bottom-start"
                                    shadow="md"
                                >
                                    <HoverCard.Target>
                                        <Box w="100%">
                                            <MultiSelect
                                                placeholder="Search slack channels"
                                                data={slackChannels}
                                                searchable
                                                creatable
                                                rightSection={
                                                    slackChannelsQuery.isLoading ?? (
                                                        <Loader size="sm" />
                                                    )
                                                }
                                                disabled={isAddSlackDisabled}
                                                getCreateLabel={(query) =>
                                                    `Send to private channel #${query}`
                                                }
                                                onCreate={(newItem) => {
                                                    setPrivateChannels(
                                                        (current) => [
                                                            ...current,
                                                            {
                                                                label: newItem,
                                                                value: newItem,
                                                                group: 'Private channels',
                                                            },
                                                        ],
                                                    );
                                                    return newItem;
                                                }}
                                                onChange={(val) => {
                                                    form.setFieldValue(
                                                        'slackTargets',
                                                        val,
                                                    );
                                                }}
                                            />
                                        </Box>
                                    </HoverCard.Target>
                                    <HoverCard.Dropdown>
                                        <SlackErrorContent
                                            slackState={slackState}
                                        />
                                    </HoverCard.Dropdown>
                                </HoverCard>
                            </Group>
                            {!isAddSlackDisabled && (
                                <Text size="xs" color="gray.6" ml={40}>
                                    If delivering to a private Slack channel,
                                    please type the name of the channel in the
                                    input box exactly as it appears in Slack.
                                    Also ensure you invite the Lightdash
                                    Slackbot into that channel.
                                </Text>
                            )}
                        </Stack>
                    </Stack>
                </Input.Wrapper>

                {/* 
                  TODO: Implement second tab with <SchedulerAdvancedOptions />
                */}
            </Stack>
            {footer}
        </form>
    );
};

export default SchedulerForm2;
