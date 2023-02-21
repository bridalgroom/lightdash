import { Card, H5, Icon } from '@blueprintjs/core';
import { IconMail } from '@tabler/icons-react';
import styled from 'styled-components';
import { ReactComponent as SlackSvg } from '../../../svgs/slack.svg';

export const SlackIcon = styled(SlackSvg)`
    width: 20px;
    height: 20px;
    margin: 5px;
`;
export const EmailIcon = styled(IconMail)`
    margin: 5px;
`;
export const TargetRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 5px;

    margin-bottom: 10px;

    .bp4-form-group {
        margin-bottom: 0;
        flex: 1;
    }
`;

export const SchedulerContainer = styled(Card)`
    display: flex;
    flex-direction: column;
    padding: 10px;
    margin-bottom: 10px;
`;

export const SchedulerName = styled(H5)`
    flex: 1;
    margin: 0;
`;

export const SchedulerDetailsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const Title = styled.span`
    font-weight: 500;
`;

export const SettingsWrapper = styled.div`
    margin-top: 50px;
`;

export const InputWrapper = styled.div`
    margin-bottom: 10px;
    width: 130px;
`;
