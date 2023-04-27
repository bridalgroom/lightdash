import { Button, Menu } from '@mantine/core';
import {
    IconBook,
    IconHelp,
    IconMessageCircle2,
    IconMessages,
    IconUsers,
} from '@tabler/icons-react';
import { FC } from 'react';
import { useIntercom } from 'react-use-intercom';

import LargeMenuItem from '../common/LargeMenuItem';
import MantineIcon from '../common/MantineIcon';

const HelpMenu: FC = () => {
    const { show: showIntercom } = useIntercom();

    return (
        <Menu
            withArrow
            shadow="lg"
            position="bottom-end"
            arrowOffset={16}
            offset={-2}
        >
            <Menu.Target>
                <Button variant="default" compact>
                    <MantineIcon icon={IconHelp} />
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                <LargeMenuItem
                    onClick={() => showIntercom()}
                    title="Contact support"
                    description="Drop us a message and we’ll get back to you asap!"
                    icon={IconMessages}
                />

                <LargeMenuItem
                    // href="https://docs.lightdash.com/"
                    // target="_blank"
                    title="View Docs"
                    description="Learn how to deploy, use, contribute to Lightdash."
                    icon={IconBook}
                />

                <LargeMenuItem
                    // href="https://join.slack.com/t/lightdash-community/shared_invite/zt-16q953ork-NZr1qdEqxSwB17E2ckUe7A"
                    // target="_blank"
                    title="Join Slack community"
                    description="Get advice share best practices with other users."
                    icon={IconUsers}
                />

                <LargeMenuItem
                    // href="https://github.com/lightdash/lightdash/issues/new/choose"
                    // target="_blank"
                    title="Feedback on Lightdash"
                    description="Submit a feature request or bug report to improve Lightdash."
                    icon={IconMessageCircle2}
                />
            </Menu.Dropdown>
        </Menu>
    );
};

export default HelpMenu;
