import { formatTimestamp } from '@lightdash/common';
import {
    ActionIcon,
    Button,
    CopyButton,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { FC, useState } from 'react';
import useHealth from '../../../hooks/health/useHealth';
import { useCreateAccessToken } from '../../../hooks/useAccessToken';

export const CreateTokenModal: FC<{
    onBackClick: () => void;
}> = ({ onBackClick }) => {
    const health = useHealth();

    // TODO: handle modal error on form submission

    const { data, mutate, isLoading } = useCreateAccessToken();

    const [expireDate, setExpireDate] = useState<Date | undefined>();
    console.log(expireDate);

    const form = useForm({
        initialValues: {
            description: '',
            expiresAt: '',
        },
    });

    const expireOptions = [
        {
            label: 'No expiration',
            value: '',
        },
        {
            label: '7 days',
            value: '7',
        },
        {
            label: '30 days',
            value: '30',
        },
        {
            label: '60 days',
            value: '60',
        },
        {
            label: '90 days',
            value: '90',
        },
    ];

    const handleOnSubmit = form.onSubmit(({ description, expiresAt }) => {
        const currentDate = new Date();
        const dateWhenExpires = !!Number(expiresAt)
            ? new Date(
                  currentDate.setDate(
                      currentDate.getDate() + Number(expiresAt),
                  ),
              )
            : undefined;
        setExpireDate(dateWhenExpires);

        mutate({
            description,
            expiresAt: dateWhenExpires,
            autoGenerated: false,
        });
    });

    return (
        <>
            <Modal
                size="lg"
                centered
                opened
                onClose={() => {
                    onBackClick();
                }}
                title={
                    <Title order={4}>
                        {data ? 'Your token has been generated' : 'New token'}
                    </Title>
                }
            >
                {!data ? (
                    <form onSubmit={handleOnSubmit}>
                        <Stack spacing="md">
                            <TextInput
                                label="What’s this token for?"
                                disabled={isLoading}
                                placeholder="Description"
                                required
                                {...form.getInputProps('description')}
                            />

                            <Select
                                withinPortal
                                defaultValue={expireOptions[0].value}
                                label="Expiration"
                                data={expireOptions}
                                required
                                {...form.getInputProps('expiresAt')}
                            ></Select>

                            <Button type="submit" disabled={isLoading}>
                                Generate token
                            </Button>
                        </Stack>
                    </form>
                ) : (
                    <Stack spacing="md">
                        <TextInput
                            id="invite-link-input"
                            label="Token"
                            readOnly
                            className="cohere-block sentry-block fs-block"
                            value={data.token}
                            rightSection={
                                <CopyButton value={data.token}>
                                    {({ copied, copy }) => (
                                        <Tooltip
                                            label={copied ? 'Copied' : 'Copy'}
                                            withArrow
                                            position="right"
                                        >
                                            <ActionIcon
                                                color={copied ? 'teal' : 'gray'}
                                                onClick={copy}
                                            >
                                                {copied ? (
                                                    <IconCheck size="1rem" />
                                                ) : (
                                                    <IconCopy size="1rem" />
                                                )}
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </CopyButton>
                            }
                        />
                        <TextInput
                            id="invite-link-input"
                            label="CLI Authentication code"
                            className="sentry-block fs-block cohere-block"
                            readOnly
                            value={`lightdash login ${health.data?.siteUrl} --token ${data.token}`}
                            rightSection={
                                <CopyButton
                                    value={`lightdash login ${health.data?.siteUrl} --token ${data.token}`}
                                >
                                    {({ copied, copy }) => (
                                        <Tooltip
                                            label={copied ? 'Copied' : 'Copy'}
                                            withArrow
                                            position="right"
                                        >
                                            <ActionIcon
                                                color={copied ? 'teal' : 'gray'}
                                                onClick={copy}
                                            >
                                                {copied ? (
                                                    <IconCheck size="1rem" />
                                                ) : (
                                                    <IconCopy size="1rem" />
                                                )}
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </CopyButton>
                            }
                        />
                        <Text>
                            {expireDate &&
                                `This token will expire on
                        ${formatTimestamp(expireDate)} `}
                            Make sure to copy your personal access token now.
                            You won’t be able to see it again!
                        </Text>
                    </Stack>
                )}
            </Modal>
        </>
    );
};
