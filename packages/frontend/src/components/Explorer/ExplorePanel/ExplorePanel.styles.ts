import { Menu } from '@blueprintjs/core';
import styled from 'styled-components';

export const LoadingStateWrapper = styled(Menu)`
    flex: 1;
`;

export const PanelTitleWrapper = styled.div`
    padding-bottom: 0.625em;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
`;

export const ContentWrapper = styled.div`
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
`;
