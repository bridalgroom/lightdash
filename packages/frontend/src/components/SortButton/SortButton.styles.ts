import { Button, Icon } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import styled from 'styled-components';

export const SortItemContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    user-select: none;
`;

export const StyledPopover = styled(Popover2)``;

export const StretchDivider = styled.div`
    flex: 1;
`;

export const LabelWrapper = styled.div`
    flex-shrink: 0;
    margin-right: 15px;
    display: flex;
    align-items: center;
`;

export const StyledXButton = styled(Button)`
    margin-left: 6px;
`;

export const StyledIcon = styled(Icon)`
    margin-right: 6px;
`;
