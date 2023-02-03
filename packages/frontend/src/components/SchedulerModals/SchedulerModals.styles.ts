import { Card, Colors, H3, H5, Icon } from '@blueprintjs/core';
import styled from 'styled-components';
import { ReactComponent as SlackSvg } from '../../svgs/slack.svg';

export const SlackIcon = styled(SlackSvg)`
    width: 20px;
    height: 20px;
    margin: 5px;
`;

export const TargetRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 5px;

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

export const SchedulerIcon = styled(Icon)`
    svg {
        color: ${Colors.GRAY2};
    }
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
