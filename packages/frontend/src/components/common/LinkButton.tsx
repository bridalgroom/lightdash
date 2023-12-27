import { Button, ButtonProps } from '@mantine/core';
import { IconTelescope } from '@tabler/icons-react';
import React, { FC } from 'react';
import { useHistory } from 'react-router-dom';
import { EventData } from '../../providers/TrackingProvider/types';
import { useTracking } from '../../providers/TrackingProvider/useTracking';
import MantineIcon from './MantineIcon';

export interface LinkButtonProps extends ButtonProps {
    href: string;
    trackingEvent?: EventData;
    target?: React.HTMLAttributeAnchorTarget;
    forceRefresh?: boolean;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const LinkButton: FC<LinkButtonProps> = ({
    href,
    target,
    trackingEvent,
    forceRefresh = false,
    onClick,
    ...rest
}) => {
    const history = useHistory();
    const { track } = useTracking();

    return (
        <Button
            {...rest}
            component="a"
            compact
            variant="subtle"
            href={href}
            leftIcon={<MantineIcon icon={IconTelescope} />}
            target={target}
            onClick={(e) => {
                if (
                    !forceRefresh &&
                    !e.ctrlKey &&
                    !e.metaKey &&
                    target !== '_blank'
                ) {
                    e.preventDefault();
                    history.push(href);
                }

                onClick?.(e);

                if (trackingEvent) track(trackingEvent);
            }}
        />
    );
};

export default LinkButton;
