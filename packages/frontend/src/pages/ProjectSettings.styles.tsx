import { Colors } from '@blueprintjs/core';
import styled from 'styled-components';
import { BigButton } from '../components/common/BigButton';

export const Subtitle = styled.p`
    color: ${Colors.GRAY2};
    margin: 0px;
`;

export const ButtonsWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
`;

export const SaveButton = styled(BigButton)`
    width: 170px;
`;
