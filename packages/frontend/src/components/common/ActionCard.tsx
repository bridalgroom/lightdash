import { Colors } from '@blueprintjs/core';
import { SessionUser, UpdatedByUser } from 'common';
import React, { Dispatch, FC, SetStateAction } from 'react';
import styled from 'styled-components';
import { useTimeAgo } from '../../hooks/useTimeAgo';
import LinkButton from './LinkButton';
import ModalActionButtons from './modal/ModalActionButtons';

type ActionCardProps<T> = {
    data: T;
    url: string;
    setActionState: Dispatch<SetStateAction<{ actionType: number; data?: T }>>;
    isChart?: boolean;
};

export const UpdatedLabel = styled.p`
    color: ${Colors.GRAY2};
    font-size: 12px;
    font-weight: 400;
    margin-top: 0.38em;
    line-height: 12px;
    margin-bottom: 0;
`;

export const UpdatedInfo: FC<{
    updatedAt: Date;
    user: Partial<SessionUser> | undefined;
}> = ({ updatedAt, user }) => {
    const timeAgo = useTimeAgo(updatedAt);

    return (
        <UpdatedLabel>
            Last edited <b>{timeAgo}</b>{' '}
            {user && user.firstName ? (
                <>
                    by{' '}
                    <b>
                        {user.firstName} {user.lastName}
                    </b>
                </>
            ) : (
                ''
            )}
        </UpdatedLabel>
    );
};

const ActionCard = <
    T extends {
        uuid: string;
        name: string;
        updatedAt: Date;
        updatedByUser?: UpdatedByUser;
    },
>(
    props: ActionCardProps<T>,
) => {
    const {
        data,
        data: { name },
        url,
        setActionState,
        isChart,
    } = props;
    return (
        <LinkButton
            href={url}
            minimal
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                height: 60,
            }}
            rightIcon={
                <ModalActionButtons
                    data={data}
                    url={url}
                    setActionState={setActionState}
                    isChart={isChart}
                />
            }
        >
            <strong>{name}</strong>
            <UpdatedInfo updatedAt={data.updatedAt} user={data.updatedByUser} />
        </LinkButton>
    );
};

export default ActionCard;
