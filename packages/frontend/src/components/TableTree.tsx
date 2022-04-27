import {
    Button,
    Classes,
    Colors,
    Dialog,
    Icon,
    Intent,
    Menu,
    MenuItem,
    PopoverPosition,
    Tree,
} from '@blueprintjs/core';
import { TreeEventHandler } from '@blueprintjs/core/src/components/tree/tree';
import { TreeNodeInfo } from '@blueprintjs/core/src/components/tree/treeNode';
import { Popover2, Tooltip2 } from '@blueprintjs/popover2';
import {
    CompiledMetric,
    CompiledTable,
    defaultSql,
    Dimension,
    DimensionType,
    fieldId,
    FieldId,
    friendlyName,
    isFilterableField,
    Metric,
    MetricType,
    Source,
} from 'common';
import Fuse from 'fuse.js';
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { useFilters } from '../hooks/useFilters';
import { useExplorer } from '../providers/ExplorerProvider';
import { TrackSection, useTracking } from '../providers/TrackingProvider';
import { EventName, SectionName } from '../types/Events';

type NodeDataProps = {
    fieldId: FieldId;
    isDimension: boolean;
    source: Source;
};

type TableTreeProps = {
    search: string;
    table: CompiledTable;
    joinSql?: string;
    onSelectedNodeChange: (fieldId: string, isDimension: boolean) => void;
    selectedNodes: Set<string>;
    onOpenSourceDialog: (source: Source) => void;
};

const TableButtons: FC<{
    joinSql?: string;
    table: CompiledTable;
    onOpenSourceDialog: (source: Source) => void;
}> = ({ joinSql, table: { source }, onOpenSourceDialog }) => {
    const [isOpen, setIsOpen] = useState<boolean>();
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

    return (
        <div style={{ display: 'inline-flex', gap: '10px' }}>
            {(source || joinSql) && (
                <Popover2
                    isOpen={isOpen === undefined ? false : isOpen}
                    onInteraction={setIsOpen}
                    content={
                        <Menu>
                            {source && (
                                <MenuItem
                                    icon={<Icon icon="console" />}
                                    text="Source"
                                    onClick={(e) => {
                                        if (source === undefined) {
                                            return;
                                        }
                                        e.stopPropagation();
                                        onOpenSourceDialog(source);
                                        setIsOpen(false);
                                    }}
                                />
                            )}
                            {joinSql && (
                                <MenuItem
                                    icon={<Icon icon="intersection" />}
                                    text="Join details"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsJoinDialogOpen(true);
                                        setIsOpen(false);
                                    }}
                                />
                            )}
                        </Menu>
                    }
                    position={PopoverPosition.BOTTOM_LEFT}
                    lazy
                >
                    <Tooltip2 content="View options">
                        <Button
                            minimal
                            icon="more"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                        />
                    </Tooltip2>
                </Popover2>
            )}
            <Dialog
                isOpen={isJoinDialogOpen}
                icon="intersection"
                onClose={() => setIsJoinDialogOpen(false)}
                title="Join details"
                lazy
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>
                        LEFT JOIN <b>{joinSql}</b>
                    </p>
                </div>
            </Dialog>
        </div>
    );
};

const getCustomMetricType = (type: DimensionType): MetricType[] => {
    switch (type) {
        case DimensionType.STRING:
        case DimensionType.TIMESTAMP:
        case DimensionType.DATE:
            return [
                MetricType.COUNT_DISTINCT,
                MetricType.COUNT,
                MetricType.MIN,
                MetricType.MAX,
            ];

        case DimensionType.NUMBER:
            return [
                MetricType.MIN,
                MetricType.MAX,
                MetricType.SUM,
                MetricType.AVERAGE,
                MetricType.COUNT_DISTINCT,
                MetricType.COUNT,
            ];
        case DimensionType.BOOLEAN:
            return [MetricType.COUNT_DISTINCT, MetricType.COUNT];
        default:
            return [];
    }
};

const NodeItemButtons: FC<{
    node: Metric | Dimension;
    onOpenSourceDialog: (source: Source) => void;
    isHovered: boolean;
}> = ({ node, onOpenSourceDialog, isHovered }) => {
    const { isFilteredField, addFilter } = useFilters();
    const isFiltered = isFilteredField(node);
    const { track } = useTracking();

    const {
        actions: { addAdditionalMetric },
    } = useExplorer();

    const createCustomMetric = useCallback(
        (dimension: Dimension, type: MetricType) => {
            addAdditionalMetric({
                name: `${dimension.name}_${type}`,
                label: `${friendlyName(type)} of ${dimension.label}`,
                table: dimension.table,
                sql: defaultSql(dimension.name),
                description: `${friendlyName(type)} of ${
                    dimension.label
                } on the table ${dimension.tableLabel}`,
                type,
            });
        },
        [addAdditionalMetric],
    );

    const menuItems = useMemo<ReactNode[]>(() => {
        const items: ReactNode[] = [];
        if (node.source) {
            items.push(
                <MenuItem
                    key="source"
                    icon={<Icon icon="console" />}
                    text="Source"
                    onClick={(e) => {
                        if (node.source === undefined) {
                            return;
                        }
                        e.stopPropagation();
                        onOpenSourceDialog(node.source);
                    }}
                />,
            );
        }
        if (isFilterableField(node)) {
            items.push(
                <MenuItem
                    key="filter"
                    icon="filter"
                    text="Add filter"
                    onClick={(e) => {
                        track({
                            name: EventName.ADD_FILTER_CLICKED,
                        });
                        e.stopPropagation();
                        addFilter(node, undefined);
                    }}
                />,
            );
        }

        if (
            node.fieldType === 'dimension' &&
            getCustomMetricType(node.type).length > 0
        ) {
            items.push(
                <MenuItem key="Add metric" icon="numerical" text="Add metric">
                    {getCustomMetricType(node.type)?.map((metric) => (
                        <MenuItem
                            key={metric}
                            text={friendlyName(metric)}
                            onClick={(e) => {
                                e.stopPropagation();
                                createCustomMetric(node, metric);
                            }}
                        />
                    ))}
                </MenuItem>,
            );
        }
        return items;
    }, [addFilter, createCustomMetric, node, onOpenSourceDialog, track]);

    return (
        <div
            style={{
                display: 'inline-flex',
                gap: '10px',
                alignItems: 'center',
                height: '30px',
                width: '60px',
            }}
        >
            {isFiltered ? (
                <Icon icon="filter" />
            ) : (
                <div style={{ width: '16px' }} />
            )}
            {menuItems.length > 0 && isHovered ? (
                <Popover2
                    content={<Menu>{menuItems}</Menu>}
                    autoFocus={false}
                    position={PopoverPosition.BOTTOM_LEFT}
                    minimal
                    lazy
                    interactionKind="click"
                    renderTarget={({ isOpen, ref, ...targetProps }) => (
                        <Tooltip2 content="View options">
                            <Button
                                {...targetProps}
                                elementRef={ref === null ? undefined : ref}
                                icon="more"
                                minimal
                                onClick={(e) => {
                                    (targetProps as any).onClick(e);
                                    e.stopPropagation();
                                }}
                            />
                        </Tooltip2>
                    )}
                />
            ) : (
                <div style={{ width: '34px' }} />
            )}
        </div>
    );
};

type DimensionWithSubDimensions = Dimension & { subDimensions?: Dimension[] };

const renderDimensionTreeNode = (
    dimension: DimensionWithSubDimensions,
    expandedNodes: Array<string | number>,
    selectedNodes: Set<string>,
    onOpenSourceDialog: (source: Source) => void,
    hoveredFieldId: string,
): TreeNodeInfo<NodeDataProps> => {
    const baseNode = {
        id: dimension.name,
        label: (
            <Tooltip2 content={dimension.description}>
                {dimension.label}
            </Tooltip2>
        ),
        secondaryLabel: (
            <NodeItemButtons
                node={dimension}
                onOpenSourceDialog={onOpenSourceDialog}
                isHovered={hoveredFieldId === fieldId(dimension)}
            />
        ),
    };
    if (dimension.subDimensions) {
        const isSubDimensionSelected = dimension.subDimensions.some(
            (subDimension) => selectedNodes.has(fieldId(subDimension)),
        );
        return {
            ...baseNode,
            isExpanded:
                expandedNodes.includes(dimension.name) ||
                isSubDimensionSelected,
            hasCaret: !isSubDimensionSelected,
            childNodes: dimension.subDimensions.map((subDimension) =>
                renderDimensionTreeNode(
                    subDimension,
                    expandedNodes,
                    selectedNodes,
                    onOpenSourceDialog,
                    hoveredFieldId,
                ),
            ),
        };
    }
    return {
        ...baseNode,
        nodeData: {
            fieldId: fieldId(dimension),
            isDimension: true,
        } as NodeDataProps,
        isSelected: selectedNodes.has(fieldId(dimension)),
    };
};

const TableTree: FC<TableTreeProps> = ({
    search,
    table,
    joinSql,
    selectedNodes,
    onSelectedNodeChange,
    onOpenSourceDialog,
}) => {
    const {
        state: {
            unsavedChartVersion: {
                metricQuery: { additionalMetrics },
            },
        },
    } = useExplorer();
    const [hoveredFieldId, setHoveredFieldId] = useState<string>('');
    const [expandedNodes, setExpandedNodes] = useState<Array<string | number>>([
        table.name,
    ]);
    const { metrics: allMetrics, dimensions: allDimensions } = table;
    const metrics: CompiledMetric[] = useMemo(() => {
        return Object.values(allMetrics).filter(({ hidden }) => !hidden);
    }, [allMetrics]);
    const dimensions: DimensionWithSubDimensions[] = useMemo(() => {
        const dimensionsWithSubDimensions = Object.values(allDimensions).reduce<
            Record<string, DimensionWithSubDimensions>
        >((acc, dimension) => {
            if (dimension.hidden) {
                return acc;
            }
            if (dimension.group) {
                return {
                    ...acc,
                    [dimension.group]: {
                        ...acc[dimension.group],
                        subDimensions: [
                            ...(acc[dimension.group].subDimensions || []),
                            dimension,
                        ],
                    },
                };
            }
            return { ...acc, [dimension.name]: dimension };
        }, {});

        return Object.values(dimensionsWithSubDimensions);
    }, [allDimensions]);

    const filteredMetrics: Metric[] = useMemo(() => {
        if (search !== '') {
            return new Fuse(metrics, {
                keys: ['name'],
                ignoreLocation: true,
                threshold: 0.3,
            })
                .search(search)
                .map((res) => res.item);
        }
        return metrics;
    }, [metrics, search]);

    const hasNoMetrics = metrics.length <= 0;

    const filteredDimensions: Dimension[] = useMemo(() => {
        if (search !== '') {
            return new Fuse(dimensions, {
                keys: ['name'],
                ignoreLocation: true,
                threshold: 0.3,
            })
                .search(search)
                .map((res) => res.item);
        }
        return dimensions;
    }, [dimensions, search]);

    const metricNode = {
        id: 'metrics',
        label: (
            <span style={{ color: Colors.ORANGE1 }}>
                <strong>Metrics</strong>
            </span>
        ),
        secondaryLabel: null,
        icon: (
            <Icon
                icon="numerical"
                intent={Intent.WARNING}
                className={Classes.TREE_NODE_ICON}
            />
        ),
        isExpanded: true,
        hasCaret: false,
        childNodes: hasNoMetrics
            ? [
                  {
                      key: 'no_metrics',
                      id: 'no_metrics',
                      label: 'No metrics defined',
                      disabled: true,
                  },
              ]
            : filteredMetrics
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((metric) => ({
                      key: metric.name,
                      id: metric.name,
                      label: (
                          <Tooltip2 content={metric.description}>
                              {metric.label}
                          </Tooltip2>
                      ),
                      nodeData: {
                          fieldId: fieldId(metric),
                          isDimension: false,
                      } as NodeDataProps,
                      isSelected: selectedNodes.has(fieldId(metric)),
                      secondaryLabel: (
                          <NodeItemButtons
                              node={metric}
                              onOpenSourceDialog={onOpenSourceDialog}
                              isHovered={hoveredFieldId === fieldId(metric)}
                          />
                      ),
                  })),
    };

    const tableAdditionalMetrics = additionalMetrics?.filter(
        (metric) => metric.table === table.name,
    );

    const customMetricsNode = {
        id: 'customMetrics',
        label: (
            <span style={{ color: Colors.ORANGE1 }}>
                <strong>Custom metrics</strong>
            </span>
        ),
        icon: (
            <Icon
                icon="clean"
                intent={Intent.WARNING}
                className={Classes.TREE_NODE_ICON}
            />
        ),
        hasCaret: false,
        isExpanded: true,
        childNodes:
            !tableAdditionalMetrics || tableAdditionalMetrics.length <= 0
                ? [
                      {
                          key: 'no_custom_metrics',
                          id: 'no_custom_metrics',
                          label: 'No custom metrics defined',
                          disabled: true,
                      },
                  ]
                : tableAdditionalMetrics
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((metric) => ({
                          key: metric.name,
                          id: metric.name,
                          label: (
                              <Tooltip2
                                  key={metric.label}
                                  content={metric.description}
                              >
                                  {metric.label}
                              </Tooltip2>
                          ),
                          nodeData: {
                              fieldId: fieldId(metric),
                              isDimension: false,
                          } as NodeDataProps,
                          isSelected: selectedNodes.has(fieldId(metric)),
                      })),
    };

    const dimensionNode = {
        id: 'dimensions',
        label: (
            <span style={{ color: Colors.BLUE1 }}>
                <strong>Dimensions</strong>
            </span>
        ),
        icon: (
            <Icon
                icon="tag"
                intent={Intent.PRIMARY}
                className={Classes.TREE_NODE_ICON}
            />
        ),
        hasCaret: false,
        isExpanded: true,
        childNodes: filteredDimensions
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((dimension) =>
                renderDimensionTreeNode(
                    dimension,
                    expandedNodes,
                    selectedNodes,
                    onOpenSourceDialog,
                    hoveredFieldId,
                ),
            ),
    };

    const contents: TreeNodeInfo<NodeDataProps>[] = [
        {
            id: table.name,
            label: table.label,
            isExpanded: expandedNodes.includes(table.name),
            secondaryLabel: (
                <TableButtons
                    joinSql={joinSql}
                    table={table}
                    onOpenSourceDialog={onOpenSourceDialog}
                />
            ),
            childNodes: [metricNode, customMetricsNode, dimensionNode],
        },
    ];

    const handleNodeClick: TreeEventHandler<NodeDataProps> = useCallback(
        (nodeData: TreeNodeInfo<NodeDataProps>, _nodePath: number[]) => {
            if (_nodePath.length !== 1 && nodeData.nodeData) {
                onSelectedNodeChange(
                    nodeData.nodeData.fieldId,
                    nodeData.nodeData.isDimension,
                );
            }
        },
        [onSelectedNodeChange],
    );

    const onNodeMouseEnter: TreeEventHandler<NodeDataProps> = useCallback(
        (node, nodePath) => {
            if (nodePath.length > 1 && node.nodeData) {
                setHoveredFieldId(node.nodeData.fieldId);
            }
        },
        [setHoveredFieldId],
    );

    const onNodeMouseLeave: TreeEventHandler<NodeDataProps> = useCallback(
        () => setHoveredFieldId(''),
        [setHoveredFieldId],
    );

    return (
        <TrackSection name={SectionName.SIDEBAR}>
            <Tree
                contents={contents}
                onNodeCollapse={(node) => {
                    setExpandedNodes((prevState) =>
                        prevState.filter((id) => id !== node.id),
                    );
                }}
                onNodeExpand={(node) => {
                    setExpandedNodes((prevState) => [...prevState, node.id]);
                }}
                onNodeClick={handleNodeClick}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
            />
        </TrackSection>
    );
};

export default TableTree;
