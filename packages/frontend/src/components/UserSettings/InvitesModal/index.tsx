import {
    CreateInviteLink,
    OrganizationMemberRole,
    validateEmail,
} from '@lightdash/common';
import { Button, Group, Modal, Select, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser } from '@tabler/icons-react';
import React, { FC, useEffect } from 'react';
import { useCreateInviteLinkMutation } from '../../../hooks/useInviteLink';
import { useApp } from '../../../providers/AppProvider';
import { TrackPage, useTracking } from '../../../providers/TrackingProvider';
import {
    CategoryName,
    EventName,
    PageName,
    PageType,
} from '../../../types/Events';
import MantineIcon from '../../common/MantineIcon';
import InviteSuccess from '../UserManagementPanel/InviteSuccess';

type SendInviteFormProps = Omit<CreateInviteLink, 'expiresAt'>;

const InvitesModal: FC<{
    opened: boolean;
    onClose: () => void;
}> = ({ opened, onClose }) => {
    const form = useForm<SendInviteFormProps>({
        initialValues: {
            email: '',
            role: OrganizationMemberRole.EDITOR,
        },
        validate: {
            email: (value: string) =>
                validateEmail(value) ? null : 'Your email address is not valid',
        },
    });
    const { track } = useTracking();
    const { health, user } = useApp();
    const {
        data: inviteLink,
        mutate,
        isLoading,
        isSuccess,
    } = useCreateInviteLinkMutation();
    const handleSubmit = (data: SendInviteFormProps) => {
        track({
            name: EventName.INVITE_BUTTON_CLICKED,
        });
        mutate(data);
    };

    useEffect(() => {
        if (isSuccess) {
            form.setFieldValue('email', '');
            form.setFieldValue('role', OrganizationMemberRole.EDITOR);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.setFieldValue, isSuccess]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group spacing="xs">
                    <MantineIcon size="lg" icon={IconUser} />
                    <Title order={4}>Add user</Title>
                </Group>
            }
            yOffset="15vw"
            size="lg"
        >
            <TrackPage
                name={PageName.INVITE_MANAGEMENT_SETTINGS}
                type={PageType.MODAL}
                category={CategoryName.SETTINGS}
            >
                <form
                    name="invite_user"
                    onSubmit={form.onSubmit((values: SendInviteFormProps) =>
                        handleSubmit(values),
                    )}
                >
                    <Group align="flex-end" spacing="xs">
                        <TextInput
                            name="email"
                            label="Enter user email address"
                            placeholder="example@gmail.com"
                            required
                            disabled={isLoading}
                            w="43%"
                            {...form.getInputProps('email')}
                        />
                        <Group spacing="xs">
                            {user.data?.ability?.can(
                                'manage',
                                'Organization',
                            ) && (
                                <Select
                                    data={Object.values(
                                        OrganizationMemberRole,
                                    ).map((orgMemberRole) => ({
                                        value: orgMemberRole,
                                        label: orgMemberRole.replace('_', ' '),
                                    }))}
                                    disabled={isLoading}
                                    required
                                    placeholder="Select role"
                                    dropdownPosition="bottom"
                                    withinPortal
                                    {...form.getInputProps('role')}
                                />
                            )}
                            <Button disabled={isLoading} type="submit">
                                {health.data?.hasEmailClient
                                    ? 'Send invite'
                                    : 'Generate invite'}
                            </Button>
                        </Group>
                    </Group>
                </form>
                {inviteLink && (
                    <InviteSuccess invite={inviteLink} hasMarginTop />
                )}
            </TrackPage>
        </Modal>
    );
};

export default InvitesModal;
