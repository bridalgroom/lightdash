import { Colors, HTMLTable } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const paddingX = 20;

export const ResourceViewListTable = styled(HTMLTable)`
    width: 100%;
    border-collapse: collapse;
`;

export const ResourceViewListTHead = styled.thead`
    background-color: ${Colors.LIGHT_GRAY5};
`;

export const ResourceViewListTr = styled.tr`
    :hover {
        background-color: ${Colors.LIGHT_GRAY5}75;
    }
`;

export const ResourceViewListTBody = styled.tbody`
    ${ResourceViewListTr} {
        cursor: pointer;
    }

    ${ResourceViewListTr}:not(:last-child) {
        border-bottom: 1pt solid ${Colors.LIGHT_GRAY3} !important;
    }
`;

export const ResourceViewListTh = styled.th`
    vertical-align: middle !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    color: ${Colors.GRAY1} !important;
    padding: 0 !important;
`;

interface ResourceViewListThInteractiveWrapperProps {
    $isInteractive: boolean;
}

export const ResourceViewListThInteractiveWrapper = styled.div<ResourceViewListThInteractiveWrapperProps>`
    padding: 7px ${paddingX}px !important;

    ${(props) =>
        props.$isInteractive
            ? `
                cursor: pointer;
                user-select: none;

                &:hover {
                    background-color: ${Colors.LIGHT_GRAY4};
                }
            `
            : ''}
`;

export const ResourceViewListTd = styled.td`
    vertical-align: middle !important;
    padding: 15px ${paddingX}px !important;
`;

export const ResourceViewListFlex = styled.div`
    display: flex;
    align-items: center;
`;

interface ResourceViewListSpacerProps {
    $width: number;
}

export const ResourceViewListSpacer = styled.div<ResourceViewListSpacerProps>`
    width: ${(props) => props.$width}px;
`;

export const ResourceViewListNameBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const ResourceViewListName = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: ${Colors.DARK_GRAY1};
`;

export const ResourceViewListMetadata = styled.div`
    font-size: 12px;
    font-weight: 400;
    color: ${Colors.GRAY2};
`;

export const ResourceViewListLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    color: ${Colors.DARK_GRAY4};

    :hover {
        text-decoration: none;
    }
`;

export const ResourceViewListSpaceLink = styled(Link)`
    font-size: 13px;
    font-weight: 500;
    color: ${Colors.GRAY2};

    &:hover {
        color: ${Colors.GRAY1};
    }
`;
