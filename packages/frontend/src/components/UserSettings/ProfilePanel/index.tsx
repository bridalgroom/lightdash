import {
    ApiError,
    LightdashUser,
    UpdateUserArgs,
    validateEmail,
} from '@lightdash/common';
import { Anchor, Button, Flex, Text, TextInput, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { lightdashApi } from '../../../api';
import useToaster from '../../../hooks/toaster/useToaster';
import {
    useEmailStatus,
    useOneTimePassword,
} from '../../../hooks/useEmailVerification';
import { VerifyEmailModal } from '../../../pages/VerifyEmail';
import { useApp } from '../../../providers/AppProvider';
import { useErrorLogs } from '../../../providers/ErrorLogsProvider';
import MantineIcon from '../../common/MantineIcon';

const updateUserQuery = async (data: Partial<UpdateUserArgs>) =>
    lightdashApi<LightdashUser>({
        url: `/user/me`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });

const ProfilePanel: FC = () => {
    const queryClient = useQueryClient();
    const { user, health } = useApp();
    const { showToastSuccess, showToastError } = useToaster();
    const { showError } = useErrorLogs();

    const isEmailServerConfigured = health.data?.hasEmailClient;
    const { data, isLoading: statusLoading } = useEmailStatus();
    const {
        mutate: sendVerificationEmail,
        error: sendVerificationEmailError,
        isLoading: emailLoading,
    } = useOneTimePassword();

    const form = useForm({
        initialValues: {
            firstName: user.data?.firstName,
            lastName: user.data?.lastName,
            email: user.data?.email,
        },
    });

    const [showVerifyEmailModal, setShowVerifyEmailModal] =
        useState<boolean>(false);

    const {
        isLoading: isUpdateUserLoading,
        error: updateUserError,
        mutate: updateUser,
    } = useMutation<LightdashUser, ApiError, Partial<UpdateUserArgs>>(
        updateUserQuery,
        {
            mutationKey: ['user_update'],
            onSuccess: async () => {
                await queryClient.refetchQueries('user');
                await queryClient.refetchQueries('email_status');
                showToastSuccess({
                    title: 'Success! User details were updated.',
                });
            },
        },
    );

    useEffect(() => {
        if (updateUserError) {
            const [title, ...rest] = updateUserError.error.message.split('\n');
            showError({
                title,
                body: rest.join('\n'),
            });
        }
        if (
            sendVerificationEmailError ||
            data?.isVerified ||
            !isEmailServerConfigured
        ) {
            setShowVerifyEmailModal(false);
        }
    }, [
        sendVerificationEmailError,
        data,
        updateUserError,
        showError,
        isEmailServerConfigured,
    ]);

    const onSubmit = form.onSubmit(({ firstName, lastName, email }) => {
        if (firstName && lastName && email && validateEmail(email)) {
            updateUser({
                firstName,
                lastName,
                email,
            });
        } else {
            const title =
                email && !validateEmail(email)
                    ? 'Invalid email'
                    : 'Required fields: first name, last name and email';
            showToastError({
                title,
                timeout: 3000,
            });
        }
    });

    return (
        <Flex dir="column" sx={{ height: 'fit-content' }}>
            <form onSubmit={onSubmit} style={{ width: '100%' }}>
                <TextInput
                    id="first-name-input"
                    placeholder="First name"
                    label="First name"
                    type="text"
                    required
                    disabled={isUpdateUserLoading}
                    data-cy="first-name-input"
                    {...form.getInputProps('firstName')}
                />

                <TextInput
                    id="last-name-input"
                    placeholder="Last name"
                    label="Last name"
                    type="text"
                    required
                    disabled={isUpdateUserLoading}
                    data-cy="last-name-input"
                    mt="md"
                    {...form.getInputProps('lastName')}
                />

                <TextInput
                    id="email-input"
                    placeholder="Email"
                    label="Email"
                    type="email"
                    required
                    disabled={isUpdateUserLoading}
                    {...form.getInputProps('email')}
                    data-cy="email-input"
                    mt="md"
                    rightSection={
                        isEmailServerConfigured && data?.isVerified ? (
                            <Tooltip
                                label="This e-mail has been verified"
                                withArrow
                            >
                                <MantineIcon
                                    size="lg"
                                    icon={IconCircleCheck}
                                    color="green.6"
                                />
                            </Tooltip>
                        ) : (
                            <MantineIcon
                                size="lg"
                                icon={IconAlertCircle}
                                color="gray.6"
                            />
                        )
                    }
                />
                {isEmailServerConfigured && !data?.isVerified ? (
                    <Text color="dimmed" mt="sm">
                        This email has not been verified.{' '}
                        <Anchor
                            component="span"
                            onClick={() => {
                                if (!data?.otp) {
                                    sendVerificationEmail();
                                }
                                setShowVerifyEmailModal(true);
                            }}
                        >
                            Click here to verify it
                        </Anchor>
                        .
                    </Text>
                ) : null}

                <Button
                    type="submit"
                    ml="auto"
                    display="flex"
                    mt="md"
                    loading={isUpdateUserLoading}
                    data-cy="update-profile-settings"
                >
                    Update
                </Button>
                <VerifyEmailModal
                    opened={showVerifyEmailModal}
                    onClose={() => {
                        setShowVerifyEmailModal(false);
                    }}
                    isLoading={statusLoading || emailLoading}
                />
            </form>
        </Flex>
    );
};

export default ProfilePanel;
