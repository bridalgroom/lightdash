import { assertUnreachable } from '@lightdash/common';
import React, { FC } from 'react';
import { useParams } from 'react-router-dom';
import { ResourceListCommonProps } from '..';
import { useSpaces } from '../../../../hooks/useSpaces';
import { ResourceListActionState } from '../ResourceActionHandlers';
import ResourceActionMenu from '../ResourceActionMenu';
import { ResourceListItem, ResourceListType } from '../ResourceTypeUtils';
import { ResourceGridItemWrapper } from './ResourceGridItem.styles';
import ResourceViewChartItem from './ResourceViewChartItem';
import ResourceViewDashboardItem from './ResourceViewDashboardItem';
import ResourceViewSpaceItem from './ResourceViewSpaceItem';

type ResourceTableProps = Pick<ResourceListCommonProps, 'items'> & {
    onAction: (newAction: ResourceListActionState) => void;
};

// TODO: extract...
const getResourceUrl = (projectUuid: string, item: ResourceListItem) => {
    const itemType = item.type;
    switch (item.type) {
        case ResourceListType.DASHBOARD:
            return `/projects/${projectUuid}/dashboards/${item.data.uuid}/view`;
        case ResourceListType.CHART:
            return `/projects/${projectUuid}/saved/${item.data.uuid}`;
        case ResourceListType.SPACE:
            return `/projects/${projectUuid}/spaces/${item.data.uuid}`;
        default:
            return assertUnreachable(item, `Can't get URL for ${itemType}`);
    }
};

const ResourceTable: FC<ResourceTableProps> = ({ items, onAction }) => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { data: spaces = [] } = useSpaces(projectUuid);

    return (
        <ResourceGridItemWrapper>
            {items.map((item) => (
                <React.Fragment key={item.type + '-' + item.data.uuid}>
                    {item.type === ResourceListType.SPACE ? (
                        <ResourceViewSpaceItem
                            url={getResourceUrl(projectUuid, item)}
                            item={item}
                            renderActions={() => (
                                <ResourceActionMenu
                                    item={item}
                                    url={getResourceUrl(projectUuid, item)}
                                    onAction={onAction}
                                    spaces={spaces}
                                />
                            )}
                        />
                    ) : item.type === ResourceListType.DASHBOARD ? (
                        <ResourceViewDashboardItem
                            url={getResourceUrl(projectUuid, item)}
                            item={item}
                            renderActions={() => (
                                <ResourceActionMenu
                                    item={item}
                                    url={getResourceUrl(projectUuid, item)}
                                    onAction={onAction}
                                    spaces={spaces}
                                />
                            )}
                        />
                    ) : item.type === ResourceListType.CHART ? (
                        <ResourceViewChartItem
                            url={getResourceUrl(projectUuid, item)}
                            item={item}
                            renderActions={() => (
                                <ResourceActionMenu
                                    item={item}
                                    url={getResourceUrl(projectUuid, item)}
                                    onAction={onAction}
                                    spaces={spaces}
                                />
                            )}
                        />
                    ) : (
                        assertUnreachable(item, `Resource type not supported`)
                    )}
                </React.Fragment>
            ))}
        </ResourceGridItemWrapper>
    );
};

export default ResourceTable;
