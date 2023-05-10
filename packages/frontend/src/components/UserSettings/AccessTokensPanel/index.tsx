import { Button, Group, Stack, Title } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { useAccessToken } from '../../../hooks/useAccessToken';
import { EmptyState } from '../../common/EmptyState';
import MantineIcon from '../../common/MantineIcon';
import { CreateTokenModal } from '../CreateTokenModal';
import { TokensTable } from './TokensTable';

const AccessTokensPanel: FC = () => {
    const { data } = useAccessToken();
    const [isCreatingToken, setIsCreatingToken] = useState(false);
    const hasAvailableTokens = data && data.length > 0;

    if (isCreatingToken) {
        return (
            <CreateTokenModal onBackClick={() => setIsCreatingToken(false)} />
        );
    }

    if (!hasAvailableTokens) {
        return (
            <EmptyState
                icon={
                    <MantineIcon
                        icon={IconKey}
                        color="gray.6"
                        stroke={1}
                        size="5xl"
                    />
                }
                title="No tokens"
                description="You haven't generated any tokens yet!, generate your first token"
            >
                <Button onClick={() => setIsCreatingToken(true)}>
                    Generate token
                </Button>
            </EmptyState>
        );
    }

    return (
        <Stack mb="lg">
            <Group position="apart">
                <Title order={5}>Personal access tokens</Title>
                <Button onClick={() => setIsCreatingToken(true)}>
                    Generate new token
                </Button>
            </Group>

            <TokensTable />
        </Stack>
    );
};

export default AccessTokensPanel;
