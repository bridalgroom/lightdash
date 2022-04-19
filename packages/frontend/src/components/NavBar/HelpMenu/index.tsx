import {
    Button,
    Icon,
    PopoverInteractionKind,
    Position,
} from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../../providers/AppProvider';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import {
    ButtonWrapper,
    HelpItem,
    IconContainer,
    ItemCTA,
    ItemDescription,
    LinkWrapper,
    MenuWrapper,
    NotificationWidget,
    NotificationWrapper,
} from './HelpMenu.styles';

const HelpMenu: FC = () => {
    const { track } = useTracking();
    const { user } = useApp();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const [hasMounted, setHasMounted] = useState<boolean>(false);

    const trackNotifications = {
        user_id: user.data?.userUuid,
        project_id: projectUuid,
        organization_id: user.data?.organizationUuid,
    };

    useEffect(() => {
        setHasMounted(true);
        if (hasMounted) {
            (window as any).Headway.init({
                selector: '#headway-badge',
                account: '7L3Bzx',
                callbacks: {
                    onShowWidget: () => {
                        track({
                            name: EventName.NOTIFICATIONS_CLICKED,
                            properties: { ...trackNotifications },
                        });
                    },
                    onShowDetails: (changelog: any) => {
                        track({
                            name: EventName.NOTIFICATIONS_ITEM_CLICKED,
                            properties: {
                                ...trackNotifications,
                                item: changelog.title,
                            },
                        });
                    },
                    onReadMore: () => {
                        track({
                            name: EventName.NOTIFICATIONS_CLICKED,
                            properties: { ...trackNotifications },
                        });
                    },
                },
            });
        } else {
            return;
        }
    }, []);

    const openChatWindow = () => {
        (window as any).$chatwoot?.toggle('true');
    };

    return (
        <>
            <NotificationWrapper>
                <Icon icon="notifications" />
                <NotificationWidget id="headway-badge"></NotificationWidget>
            </NotificationWrapper>
            <Popover2
                interactionKind={PopoverInteractionKind.CLICK}
                content={
                    <MenuWrapper>
                        <ButtonWrapper onClick={() => openChatWindow()}>
                            <HelpItem>
                                <IconContainer>
                                    <Icon icon="chat" />
                                </IconContainer>
                                <div>
                                    <ItemCTA>Contact support</ItemCTA>
                                    <ItemDescription>
                                        Drop us a message and we’ll get back to
                                        you asap!
                                    </ItemDescription>
                                </div>
                            </HelpItem>
                        </ButtonWrapper>
                        <LinkWrapper
                            role="button"
                            href="https://docs.lightdash.com/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <HelpItem>
                                <IconContainer>
                                    <Icon icon="manual" />
                                </IconContainer>
                                <div>
                                    <ItemCTA>View Docs</ItemCTA>
                                    <ItemDescription>
                                        Learn how to deploy, use, &amp;
                                        contribute to Lightdash
                                    </ItemDescription>
                                </div>
                            </HelpItem>
                        </LinkWrapper>
                        <LinkWrapper
                            role="button"
                            href="https://github.com/lightdash/lightdash/discussions"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <HelpItem>
                                <IconContainer>
                                    <Icon icon="people" />
                                </IconContainer>

                                <div>
                                    <ItemCTA>Join the discussion</ItemCTA>
                                    <ItemDescription>
                                        Get advice &amp; share best practices
                                        with other users.
                                    </ItemDescription>
                                </div>
                            </HelpItem>
                        </LinkWrapper>
                    </MenuWrapper>
                }
                position={Position.BOTTOM_LEFT}
            >
                <Button minimal icon="help" />
            </Popover2>
        </>
    );
};

export default HelpMenu;
