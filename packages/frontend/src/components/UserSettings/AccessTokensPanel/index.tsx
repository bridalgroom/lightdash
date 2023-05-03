import { Button } from '@blueprintjs/core';
import { Flex, Title } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { useAccessToken } from '../../../hooks/useAccessToken';
import { EmptyState } from '../../common/EmptyState';
import MantineIcon from '../../common/MantineIcon';
import CreateTokenPanel from '../CreateTokenPanel';
import { TokensTable } from './TokensTable';

const AccessTokensPanel: FC = () => {
    const { data } = useAccessToken();
    const [createTokenPanel, setCreateInvitesPanel] = useState(false);
    const hasAvailableTokens = data && data.length > 0;
    if (createTokenPanel) {
        return (
            <CreateTokenPanel
                onBackClick={() => setCreateInvitesPanel(false)}
            />
        );
    }

    if (!hasAvailableTokens) {
        return (
            <Flex h="100%" direction="column" justify="center" align="center">
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
                    <Button onClick={() => setCreateInvitesPanel(true)}>
                        Generate token
                    </Button>
                </EmptyState>
            </Flex>
        );
    }

    return (
        <>
            <Flex justify="space-between" align="center" mb="lg">
                <Title order={5}>Personal access tokens</Title>
                <Button onClick={() => setCreateInvitesPanel(true)}>
                    Generate new token
                </Button>
            </Flex>

            <TokensTable />
        </>
    );
};

export default AccessTokensPanel;
