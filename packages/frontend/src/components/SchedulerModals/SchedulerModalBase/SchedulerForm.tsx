import {
    Button,
    Classes,
    Colors,
    FormGroup,
    HTMLSelect,
    NumericInput,
    Radio,
    RadioGroup,
} from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import React, { FC, useEffect, useMemo, useState } from 'react';
import useHealth from '../../../hooks/health/useHealth';
import { useSlackChannels } from '../../../hooks/slack/useSlackChannels';
import { useGetSlack } from '../../../hooks/useSlack';
import { isInvalidCronExpression } from '../../../utils/fieldValidators';
import { ArrayInput } from '../../ReactHookForm/ArrayInput';
import AutoComplete from '../../ReactHookForm/AutoComplete';
import CronInput from '../../ReactHookForm/CronInput';
import Form from '../../ReactHookForm/Form';
import Input from '../../ReactHookForm/Input';
import { hasRequiredScopes } from '../../UserSettings/SlackSettingsPanel';
import {
    EmailIcon,
    InputWrapper,
    SlackIcon,
    TargetRow,
    Title,
} from './SchedulerModalBase.styles';

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
                <p>No Slack integration found</p>
                <p>
                    To create a slack scheduled delivery, you need to
                    <a href="https://docs.lightdash.com/guides/enable-slack-selfhost">
                        {' '}
                        setup Slack{' '}
                    </a>
                    for your Lightdash instance
                </p>
            </>
        );
    } else if (slackState === SlackStates.MISSING_SCOPES) {
        return (
            <>
                <p>Slack integration needs to be reinstalled</p>
                <p>
                    To create a slack scheduled delivery, you need to
                    <a href="/generalSettings/slack">
                        {' '}
                        reinstall the Slack integration{' '}
                    </a>
                    for your organisation
                </p>
            </>
        );
    }
    return <></>;
};

const SchedulerOptions: FC<
    { disabled: boolean } & React.ComponentProps<typeof Form>
> = ({ disabled, methods, ...rest }) => {
    const [format, setFormat] = useState(
        methods.getValues()?.options?.formatted === false
            ? Values.RAW
            : Values.FORMATTED,
    );
    const [defaultCustomLimit, defaultLimit] = useMemo(() => {
        const limit = methods.getValues()?.options?.limit;
        switch (limit) {
            case undefined:
            case Limit.TABLE:
                return [1, Limit.TABLE];
            case Limit.ALL:
                return [1, Limit.ALL];

            default:
                return [limit, Limit.CUSTOM];
        }
    }, [methods.getValues()?.options?.limit]);
    const [customLimit, setCustomLimit] = useState<number>(defaultCustomLimit);
    const [limit, setLimit] = useState<string>(defaultLimit);

    useEffect(() => {
        if (limit === Limit.CUSTOM) {
            methods.setValue('options.limit', customLimit);
        }
        methods.setValue('options.limit', limit);
    }, [methods, defaultCustomLimit, limit]);
    useEffect(() => {
        methods.setValue('options.formatted', format === Values.FORMATTED);
    }, [methods, format]);

    return (
        <Form name="options" methods={methods} {...rest}>
            <FormGroup>
                <RadioGroup
                    label={<Title>Values</Title>}
                    onChange={(e: any) => {
                        setFormat(e.currentTarget.value);
                    }}
                    selectedValue={format}
                >
                    <Radio label="Formatted" value={Values.FORMATTED} />
                    <Radio label="Raw" value={Values.RAW} />
                </RadioGroup>
            </FormGroup>

            <RadioGroup
                selectedValue={limit}
                label={<Title>Limit</Title>}
                onChange={(e: any) => {
                    const limitValue = e.currentTarget.value;
                    setLimit(limitValue);
                }}
            >
                <Radio label="Results in Table" value={Limit.TABLE} />
                <Radio label="All Results" value={Limit.ALL} />
                <Radio label="Custom..." value={Limit.CUSTOM} />

                {limit === Limit.CUSTOM && (
                    <InputWrapper>
                        <NumericInput
                            value={customLimit}
                            min={1}
                            fill
                            onValueChange={(value: any) => {
                                setCustomLimit(value);
                            }}
                        />
                    </InputWrapper>
                )}
            </RadioGroup>
        </Form>
    );
};

const SchedulerSettings: FC<
    { disabled: boolean } & React.ComponentProps<typeof Form>
> = ({ disabled, methods, ...rest }) => {
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
    const slackChannels = useMemo(
        () =>
            (slackChannelsQuery.data || []).map((channel) => ({
                value: channel.id,
                label: channel.name,
            })),
        [slackChannelsQuery.data],
    );
    const health = useHealth();

    const isAddSlackDisabled = disabled || slackState !== SlackStates.SUCCESS;
    const isAddEmailDisabled = disabled || !health.data?.hasEmailClient;

    const [isCsv, setIsCsv] = useState<boolean>(
        methods.getValues()?.format === 'csv',
    );

    return (
        <Form name="scheduler" methods={methods} {...rest}>
            <Input
                label="Name"
                name="name"
                placeholder="Scheduled delivery name"
                disabled={disabled}
                rules={{
                    required: 'Required field',
                }}
            />
            <CronInput
                name="cron"
                defaultValue="0 9 * * 1"
                disabled={disabled}
                rules={{
                    required: 'Required field',
                    validate: {
                        isValidCronExpression:
                            isInvalidCronExpression('Cron expression'),
                    },
                }}
            />
            <FormGroup label={<Title>Format</Title>}>
                <HTMLSelect
                    name="format"
                    value={isCsv ? 'csv' : 'image'}
                    onChange={(e) => {
                        methods.setValue('format', e.currentTarget.value);

                        const isCsvValue = e.currentTarget.value === 'csv';
                        setIsCsv(isCsvValue);
                        if (!isCsvValue) methods.setValue('options', {});
                    }}
                    options={[
                        { value: 'image', label: 'Image' },
                        { value: 'csv', label: 'CSV' },
                    ]}
                />
            </FormGroup>

            {isCsv && (
                <SchedulerOptions disabled={disabled} methods={methods} />
            )}

            <ArrayInput
                label="Send to"
                name="targets"
                disabled={disabled}
                renderRow={(key, index, remove) => {
                    const isSlack =
                        methods.getValues()?.targets?.[index]?.channel !==
                        undefined;

                    if (isSlack) {
                        return (
                            <TargetRow key={key}>
                                <SlackIcon />
                                <AutoComplete
                                    name={`targets.${index}.channel`}
                                    items={slackChannels}
                                    disabled={disabled}
                                    isLoading={slackChannelsQuery.isLoading}
                                    rules={{
                                        required: 'Required field',
                                    }}
                                    suggestProps={{
                                        inputProps: {
                                            placeholder:
                                                'Search slack channel...',
                                        },
                                    }}
                                />
                                <Button
                                    minimal={true}
                                    icon={'cross'}
                                    onClick={() => remove(index)}
                                    disabled={disabled}
                                />
                            </TargetRow>
                        );
                    } else {
                        return (
                            <TargetRow key={key}>
                                <EmailIcon size={20} color={Colors.GRAY1} />
                                <Input
                                    name={`targets.${index}.recipient`}
                                    placeholder="Email recipient"
                                    disabled={disabled}
                                    rules={{
                                        required: 'Required field',
                                    }}
                                />
                                <Button
                                    minimal={true}
                                    icon={'cross'}
                                    onClick={() => remove(index)}
                                    disabled={disabled}
                                />
                            </TargetRow>
                        );
                    }
                }}
                renderAppendRowButton={(append) => (
                    <>
                        <Tooltip2
                            interactionKind="hover"
                            content={<>{SlackErrorContent({ slackState })}</>}
                            position="bottom"
                            disabled={slackState === SlackStates.SUCCESS}
                        >
                            <Button
                                minimal
                                className={
                                    isAddSlackDisabled
                                        ? Classes.DISABLED
                                        : undefined
                                }
                                onClick={
                                    isAddSlackDisabled
                                        ? undefined
                                        : () => append({ channel: '' })
                                }
                                icon={'plus'}
                                text="Add slack"
                            />
                        </Tooltip2>
                        <Tooltip2
                            interactionKind="hover"
                            content={
                                <>
                                    <p>No Email integration found</p>
                                    <p>
                                        To create a slack scheduled delivery,
                                        you need to add
                                        <a href="https://docs.lightdash.com/references/environmentVariables">
                                            {' '}
                                            SMTP environment variables{' '}
                                        </a>
                                        for your Lightdash instance
                                    </p>
                                </>
                            }
                            position="bottom"
                            disabled={health.data?.hasEmailClient}
                        >
                            <Button
                                minimal
                                onClick={
                                    isAddEmailDisabled
                                        ? undefined
                                        : () => append({ recipients: '' })
                                }
                                icon={'plus'}
                                text="Add email"
                                className={
                                    isAddEmailDisabled
                                        ? Classes.DISABLED
                                        : undefined
                                }
                            />
                        </Tooltip2>
                    </>
                )}
            />
        </Form>
    );
};

const SchedulerForm: FC<
    { disabled: boolean } & React.ComponentProps<typeof Form>
> = ({ disabled, methods, ...rest }) => {
    return <SchedulerSettings disabled={disabled} methods={methods} />;
};

export default SchedulerForm;
