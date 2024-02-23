import {
    assertUnreachable,
    Comment,
    CreateDashboard,
    Dashboard,
    DashboardBasicDetails,
    DashboardChartTile,
    DashboardLoomTile,
    DashboardMarkdownTile,
    DashboardTileTypes,
    DashboardUnversionedFields,
    DashboardVersionedFields,
    LightdashUser,
    NotFoundError,
    SavedChart,
    SessionUser,
    UnexpectedServerError,
    UpdateMultipleDashboards,
} from '@lightdash/common';
import { Knex } from 'knex';
import { AnalyticsDashboardViewsTableName } from '../../database/entities/analytics';
import {
    DashboardsTableName,
    DashboardTable,
    DashboardTileChartTable,
    DashboardTileChartTableName,
    DashboardTileCommentsTableName,
    DashboardTileLoomsTableName,
    DashboardTileMarkdownsTableName,
    DashboardTilesTableName,
    DashboardVersionsTableName,
    DashboardVersionTable,
    DashboardViewsTableName,
    DbDashboardTileComments,
} from '../../database/entities/dashboards';
import {
    OrganizationTable,
    OrganizationTableName,
} from '../../database/entities/organizations';
import {
    PinnedDashboardTable,
    PinnedDashboardTableName,
    PinnedListTable,
    PinnedListTableName,
} from '../../database/entities/pinnedList';
import {
    ProjectTable,
    ProjectTableName,
} from '../../database/entities/projects';
import {
    SavedChartsTableName,
    SavedChartTable,
} from '../../database/entities/savedCharts';
import { getSpaceId, SpaceTableName } from '../../database/entities/spaces';
import { UserTable, UserTableName } from '../../database/entities/users';
import { DbValidationTable } from '../../database/entities/validation';
import Transaction = Knex.Transaction;

export type GetDashboardQuery = Pick<
    DashboardTable['base'],
    'dashboard_id' | 'dashboard_uuid' | 'name' | 'description'
> &
    Pick<DashboardVersionTable['base'], 'dashboard_version_id' | 'created_at'> &
    Pick<ProjectTable['base'], 'project_uuid'> &
    Pick<UserTable['base'], 'user_uuid' | 'first_name' | 'last_name'> &
    Pick<OrganizationTable['base'], 'organization_uuid'> &
    Pick<PinnedListTable['base'], 'pinned_list_uuid'> &
    Pick<PinnedDashboardTable['base'], 'order'> & {
        views: string;
        first_viewed_at: Date | null;
    };

export type GetDashboardDetailsQuery = Pick<
    DashboardTable['base'],
    'dashboard_uuid' | 'name' | 'description'
> &
    Pick<DashboardVersionTable['base'], 'created_at'> &
    Pick<ProjectTable['base'], 'project_uuid'> &
    Pick<UserTable['base'], 'user_uuid' | 'first_name' | 'last_name'> &
    Pick<OrganizationTable['base'], 'organization_uuid'> &
    Pick<PinnedListTable['base'], 'pinned_list_uuid'> &
    Pick<PinnedDashboardTable['base'], 'order'> & {
        views: string;
    };

export type GetChartTileQuery = Pick<
    DashboardTileChartTable['base'],
    'dashboard_tile_uuid'
> &
    Pick<SavedChartTable['base'], 'saved_query_uuid'>;

type DashboardModelDependencies = {
    database: Knex;
};

export class DashboardModel {
    private readonly database: Knex;

    constructor(deps: DashboardModelDependencies) {
        this.database = deps.database;
    }

    private static async createVersion(
        trx: Transaction,
        dashboardId: number,
        version: DashboardVersionedFields,
    ): Promise<void> {
        const [versionId] = await trx(DashboardVersionsTableName).insert(
            {
                dashboard_id: dashboardId,
                updated_by_user_uuid: version.updatedByUser?.userUuid,
            },
            ['dashboard_version_id', 'updated_by_user_uuid'],
        );

        await trx(DashboardViewsTableName).insert({
            dashboard_version_id: versionId.dashboard_version_id,
            name: 'Default',
            filters: version.filters || {
                dimensions: [],
                metrics: [],
                tableCalculations: [],
            },
        });

        const tilePromises = version.tiles.map(async (tile) => {
            const { uuid: dashboardTileId, type, w, h, x, y } = tile;

            const [insertedTile] = await trx(DashboardTilesTableName)
                .insert({
                    dashboard_version_id: versionId.dashboard_version_id,
                    dashboard_tile_uuid: dashboardTileId,
                    type,
                    height: h,
                    width: w,
                    x_offset: x,
                    y_offset: y,
                })
                .returning('*');

            switch (tile.type) {
                case DashboardTileTypes.SAVED_CHART: {
                    const chartUuid = tile.properties.savedChartUuid;
                    if (chartUuid) {
                        const [savedChart] = await trx(SavedChartsTableName)
                            .select(['saved_query_id'])
                            .where('saved_query_uuid', chartUuid)
                            .limit(1);
                        if (!savedChart) {
                            throw new NotFoundError('Saved chart not found');
                        }
                        await trx(DashboardTileChartTableName).insert({
                            dashboard_version_id:
                                versionId.dashboard_version_id,
                            dashboard_tile_uuid:
                                insertedTile.dashboard_tile_uuid,
                            saved_chart_id: savedChart.saved_query_id,
                            hide_title: tile.properties.hideTitle,
                            title: tile.properties.title,
                        });
                    }
                    break;
                }
                case DashboardTileTypes.MARKDOWN:
                    await trx(DashboardTileMarkdownsTableName).insert({
                        dashboard_version_id: versionId.dashboard_version_id,
                        dashboard_tile_uuid: insertedTile.dashboard_tile_uuid,
                        title: tile.properties.title,
                        content: tile.properties.content,
                    });
                    break;
                case DashboardTileTypes.LOOM:
                    await trx(DashboardTileLoomsTableName).insert({
                        dashboard_version_id: versionId.dashboard_version_id,
                        dashboard_tile_uuid: insertedTile.dashboard_tile_uuid,
                        title: tile.properties.title,
                        url: tile.properties.url,
                        hide_title: tile.properties.hideTitle,
                    });
                    break;
                default: {
                    const never: never = tile;
                    throw new UnexpectedServerError(
                        `Dashboard tile type "${type}" not recognised`,
                    );
                }
            }

            return insertedTile;
        });

        const tiles = await Promise.all(tilePromises);
        const tileUuids = tiles.map((tile) => tile.dashboard_tile_uuid);

        // TODO: remove after resolving a problem with importing lodash-es in the backend
        const pick = <T>(object: Record<string, T>, keys: string[]) =>
            Object.keys(object)
                .filter((key) => keys.includes(key))
                .reduce<typeof object>(
                    (obj, key) => ({ ...obj, [key]: object[key] }),
                    {},
                );

        await trx(DashboardViewsTableName)
            .update({
                filters: {
                    dimensions:
                        version.filters?.dimensions.map((filter) => ({
                            ...filter,
                            tileTargets: filter.tileTargets
                                ? pick(filter.tileTargets, tileUuids)
                                : undefined,
                        })) ?? [],
                    metrics:
                        version.filters?.metrics.map((filter) => ({
                            ...filter,
                            tileTargets: filter.tileTargets
                                ? pick(filter.tileTargets, tileUuids)
                                : undefined,
                        })) ?? [],
                    tableCalculations:
                        version.filters?.tableCalculations.map((filter) => ({
                            ...filter,
                            tileTargets: filter.tileTargets
                                ? pick(filter.tileTargets, tileUuids)
                                : undefined,
                        })) ?? [],
                },
            })
            .where({ dashboard_version_id: versionId.dashboard_version_id });
    }

    async getAllByProject(
        projectUuid: string,
        chartUuid?: string,
    ): Promise<DashboardBasicDetails[]> {
        const cteTableName = 'cte';
        const dashboardsQuery = this.database
            .with(cteTableName, (queryBuilder) => {
                queryBuilder
                    .table(DashboardsTableName)
                    .leftJoin(
                        DashboardVersionsTableName,
                        `${DashboardsTableName}.dashboard_id`,
                        `${DashboardVersionsTableName}.dashboard_id`,
                    )
                    .leftJoin(
                        SpaceTableName,
                        `${DashboardsTableName}.space_id`,
                        `${SpaceTableName}.space_id`,
                    )
                    .leftJoin(
                        UserTableName,
                        `${UserTableName}.user_uuid`,
                        `${DashboardVersionsTableName}.updated_by_user_uuid`,
                    )
                    .innerJoin(
                        ProjectTableName,
                        `${SpaceTableName}.project_id`,
                        `${ProjectTableName}.project_id`,
                    )
                    .innerJoin(
                        OrganizationTableName,
                        `${ProjectTableName}.organization_id`,
                        `${OrganizationTableName}.organization_id`,
                    )
                    .leftJoin(
                        PinnedDashboardTableName,
                        `${PinnedDashboardTableName}.dashboard_uuid`,
                        `${DashboardsTableName}.dashboard_uuid`,
                    )
                    .leftJoin(
                        PinnedListTableName,
                        `${PinnedListTableName}.pinned_list_uuid`,
                        `${PinnedDashboardTableName}.pinned_list_uuid`,
                    )
                    .select<GetDashboardDetailsQuery[]>([
                        `${DashboardsTableName}.dashboard_uuid`,
                        `${DashboardsTableName}.name`,
                        `${DashboardsTableName}.description`,
                        `${DashboardVersionsTableName}.created_at`,
                        `${DashboardVersionsTableName}.dashboard_version_id`,
                        `${ProjectTableName}.project_uuid`,
                        `${UserTableName}.user_uuid`,
                        `${UserTableName}.first_name`,
                        `${UserTableName}.last_name`,
                        `${OrganizationTableName}.organization_uuid`,
                        `${SpaceTableName}.space_uuid`,
                        `${PinnedListTableName}.pinned_list_uuid`,
                        `${PinnedDashboardTableName}.order`,
                        this.database.raw(
                            `(SELECT COUNT('${AnalyticsDashboardViewsTableName}.dashboard_uuid') FROM ${AnalyticsDashboardViewsTableName} where ${AnalyticsDashboardViewsTableName}.dashboard_uuid = ${DashboardsTableName}.dashboard_uuid) as views`,
                        ),
                        this.database.raw(
                            `(SELECT ${AnalyticsDashboardViewsTableName}.timestamp FROM ${AnalyticsDashboardViewsTableName} where ${AnalyticsDashboardViewsTableName}.dashboard_uuid = ${DashboardsTableName}.dashboard_uuid ORDER BY ${AnalyticsDashboardViewsTableName}.timestamp ASC LIMIT 1) as first_viewed_at`,
                        ),
                        this.database.raw(`
                            COALESCE(
                                (
                                    SELECT json_agg(validations.*) 
                                    FROM validations 
                                    WHERE validations.dashboard_uuid = ${DashboardsTableName}.dashboard_uuid
                                ), '[]'
                            ) as validation_errors
                        `),
                    ])
                    .orderBy([
                        {
                            column: `${DashboardVersionsTableName}.dashboard_id`,
                        },
                        {
                            column: `${DashboardVersionsTableName}.created_at`,
                            order: 'desc',
                        },
                    ])
                    .distinctOn(`${DashboardVersionsTableName}.dashboard_id`)
                    .where(`${ProjectTableName}.project_uuid`, projectUuid);
            })
            .select(`${cteTableName}.*`);

        if (chartUuid) {
            dashboardsQuery
                .leftJoin(
                    DashboardTilesTableName,
                    `${DashboardTilesTableName}.dashboard_version_id`,
                    `${cteTableName}.dashboard_version_id`,
                )
                .leftJoin(
                    DashboardTileChartTableName,
                    `${DashboardTileChartTableName}.dashboard_tile_uuid`,
                    `${DashboardTilesTableName}.dashboard_tile_uuid`,
                )
                .leftJoin(
                    SavedChartsTableName,
                    `${SavedChartsTableName}.saved_query_id`,
                    `${DashboardTileChartTableName}.saved_chart_id`,
                )
                .distinctOn(`${cteTableName}.dashboard_uuid`)
                .andWhere(
                    `${SavedChartsTableName}.saved_query_uuid`,
                    chartUuid,
                );
        }
        const dashboards = await dashboardsQuery.from(cteTableName);

        return dashboards.map(
            ({
                name,
                description,
                dashboard_uuid,
                created_at,
                project_uuid,
                user_uuid,
                first_name,
                last_name,
                organization_uuid,
                space_uuid,
                pinned_list_uuid,
                order,
                views,
                first_viewed_at,
                validation_errors,
            }) => ({
                organizationUuid: organization_uuid,
                name,
                description,
                uuid: dashboard_uuid,
                updatedAt: created_at,
                projectUuid: project_uuid,
                updatedByUser: {
                    userUuid: user_uuid,
                    firstName: first_name,
                    lastName: last_name,
                },
                spaceUuid: space_uuid,
                pinnedListUuid: pinned_list_uuid,
                pinnedListOrder: order,
                views: parseInt(views, 10) || 0,
                firstViewedAt: first_viewed_at,
                validationErrors: validation_errors?.map(
                    (error: DbValidationTable) => ({
                        validationId: error.validation_id,
                        error: error.error,
                        createdAt: error.created_at,
                    }),
                ),
            }),
        );
    }

    async getById(dashboardUuid: string): Promise<Dashboard> {
        const [dashboard] = await this.database(DashboardsTableName)
            .leftJoin(
                DashboardVersionsTableName,
                `${DashboardsTableName}.dashboard_id`,
                `${DashboardVersionsTableName}.dashboard_id`,
            )
            .leftJoin(
                UserTableName,
                `${DashboardVersionsTableName}.updated_by_user_uuid`,
                `${UserTableName}.user_uuid`,
            )
            .leftJoin(
                SpaceTableName,
                `${DashboardsTableName}.space_id`,
                `${SpaceTableName}.space_id`,
            )
            .leftJoin(
                ProjectTableName,
                `${ProjectTableName}.project_id`,
                `${SpaceTableName}.project_id`,
            )
            .leftJoin(
                OrganizationTableName,
                `${OrganizationTableName}.organization_id`,
                `${ProjectTableName}.organization_id`,
            )
            .leftJoin(
                PinnedDashboardTableName,
                `${PinnedDashboardTableName}.dashboard_uuid`,
                `${DashboardsTableName}.dashboard_uuid`,
            )
            .leftJoin(
                PinnedListTableName,
                `${PinnedListTableName}.pinned_list_uuid`,
                `${PinnedDashboardTableName}.pinned_list_uuid`,
            )
            .select<
                (GetDashboardQuery & {
                    space_uuid: string;
                    space_name: string;
                })[]
            >([
                `${ProjectTableName}.project_uuid`,
                `${DashboardsTableName}.dashboard_id`,
                `${DashboardsTableName}.dashboard_uuid`,
                `${DashboardsTableName}.name`,
                `${DashboardsTableName}.description`,
                `${DashboardVersionsTableName}.dashboard_version_id`,
                `${DashboardVersionsTableName}.created_at`,
                `${UserTableName}.user_uuid`,
                `${UserTableName}.first_name`,
                `${UserTableName}.last_name`,
                `${OrganizationTableName}.organization_uuid`,
                `${SpaceTableName}.space_uuid`,
                `${SpaceTableName}.name as space_name`,
                `${PinnedListTableName}.pinned_list_uuid`,
                `${PinnedDashboardTableName}.order`,
                this.database.raw(
                    `(SELECT COUNT('${AnalyticsDashboardViewsTableName}.dashboard_uuid') FROM ${AnalyticsDashboardViewsTableName} where ${AnalyticsDashboardViewsTableName}.dashboard_uuid = ?) as views`,
                    dashboardUuid,
                ),
                this.database.raw(
                    `(SELECT ${AnalyticsDashboardViewsTableName}.timestamp FROM ${AnalyticsDashboardViewsTableName} where ${AnalyticsDashboardViewsTableName}.dashboard_uuid = ? ORDER BY ${AnalyticsDashboardViewsTableName}.timestamp ASC LIMIT 1) as first_viewed_at`,
                    dashboardUuid,
                ),
            ])
            .where(`${DashboardsTableName}.dashboard_uuid`, dashboardUuid)
            .orderBy(`${DashboardVersionsTableName}.created_at`, 'desc')
            .limit(1);

        if (!dashboard) {
            throw new NotFoundError('Dashboard not found');
        }

        const [view] = await this.database(DashboardViewsTableName)
            .select('*')
            .orderBy(`${DashboardViewsTableName}.created_at`, 'desc')
            .where(`dashboard_version_id`, dashboard.dashboard_version_id);

        const tiles = await this.database(DashboardTilesTableName)
            .select<
                {
                    x_offset: number;
                    y_offset: number;
                    type: DashboardTileTypes;
                    width: number;
                    height: number;
                    dashboard_tile_uuid: string;
                    saved_query_uuid: string | null;
                    url: string | null;
                    content: string | null;
                    hide_title: boolean | null;
                    title: string | null;
                    views: string;
                    first_viewed_at: Date | null;
                    belongs_to_dashboard: boolean;
                    name: string | null;
                    last_version_chart_kind: string | null;
                }[]
            >(
                `${DashboardTilesTableName}.x_offset`,
                `${DashboardTilesTableName}.y_offset`,
                `${DashboardTilesTableName}.type`,
                `${DashboardTilesTableName}.width`,
                `${DashboardTilesTableName}.height`,
                `${DashboardTilesTableName}.dashboard_tile_uuid`,
                `${SavedChartsTableName}.saved_query_uuid`,
                `${SavedChartsTableName}.name`,
                `${SavedChartsTableName}.last_version_chart_kind`,
                this.database.raw(
                    `${SavedChartsTableName}.dashboard_uuid IS NOT NULL AS belongs_to_dashboard`,
                ),
                this.database.raw(
                    `COALESCE(
                        ${DashboardTileChartTableName}.title,
                        ${DashboardTileLoomsTableName}.title,
                        ${DashboardTileMarkdownsTableName}.title
                    ) AS title`,
                ),
                this.database.raw(
                    `COALESCE(
                        ${DashboardTileLoomsTableName}.hide_title,
                        ${DashboardTileChartTableName}.hide_title
                    ) AS hide_title`,
                ),
                `${DashboardTileLoomsTableName}.url`,
                `${DashboardTileMarkdownsTableName}.content`,
            )
            .leftJoin(DashboardTileChartTableName, function chartsJoin() {
                this.on(
                    `${DashboardTileChartTableName}.dashboard_tile_uuid`,
                    '=',
                    `${DashboardTilesTableName}.dashboard_tile_uuid`,
                );
                this.andOn(
                    `${DashboardTileChartTableName}.dashboard_version_id`,
                    '=',
                    `${DashboardTilesTableName}.dashboard_version_id`,
                );
            })
            .leftJoin(DashboardTileLoomsTableName, function loomsJoin() {
                this.on(
                    `${DashboardTileLoomsTableName}.dashboard_tile_uuid`,
                    '=',
                    `${DashboardTilesTableName}.dashboard_tile_uuid`,
                );
                this.andOn(
                    `${DashboardTileLoomsTableName}.dashboard_version_id`,
                    '=',
                    `${DashboardTilesTableName}.dashboard_version_id`,
                );
            })
            .leftJoin(DashboardTileMarkdownsTableName, function markdownJoin() {
                this.on(
                    `${DashboardTileMarkdownsTableName}.dashboard_tile_uuid`,
                    '=',
                    `${DashboardTilesTableName}.dashboard_tile_uuid`,
                );
                this.andOn(
                    `${DashboardTileMarkdownsTableName}.dashboard_version_id`,
                    '=',
                    `${DashboardTilesTableName}.dashboard_version_id`,
                );
            })
            .leftJoin(
                SavedChartsTableName,
                `${DashboardTileChartTableName}.saved_chart_id`,
                `${SavedChartsTableName}.saved_query_id`,
            )
            .where(
                `${DashboardTilesTableName}.dashboard_version_id`,
                dashboard.dashboard_version_id,
            );

        const tableCalculationFilters = view?.filters?.tableCalculations;
        view.filters.tableCalculations = tableCalculationFilters || [];

        return {
            organizationUuid: dashboard.organization_uuid,
            projectUuid: dashboard.project_uuid,
            uuid: dashboard.dashboard_uuid,
            name: dashboard.name,
            description: dashboard.description,
            updatedAt: dashboard.created_at,
            pinnedListUuid: dashboard.pinned_list_uuid,
            pinnedListOrder: dashboard.order,
            tiles: tiles.map(
                ({
                    type,
                    height,
                    width,
                    x_offset,
                    y_offset,
                    dashboard_tile_uuid,
                    saved_query_uuid,
                    title,
                    hide_title,
                    url,
                    content,
                    belongs_to_dashboard,
                    name,
                    last_version_chart_kind,
                }) => {
                    const base: Omit<
                        Dashboard['tiles'][number],
                        'type' | 'properties'
                    > = {
                        uuid: dashboard_tile_uuid,
                        x: x_offset,
                        y: y_offset,
                        h: height,
                        w: width,
                    };

                    const commonProperties = {
                        title: title ?? '',
                        hideTitle: hide_title ?? false,
                    };

                    switch (type) {
                        case DashboardTileTypes.SAVED_CHART:
                            return <DashboardChartTile>{
                                ...base,
                                type: DashboardTileTypes.SAVED_CHART,
                                properties: {
                                    ...commonProperties,
                                    savedChartUuid: saved_query_uuid,
                                    belongsToDashboard: belongs_to_dashboard,
                                    chartName: name,
                                    lastVersionChartKind:
                                        last_version_chart_kind,
                                },
                            };
                        case DashboardTileTypes.MARKDOWN:
                            return <DashboardMarkdownTile>{
                                ...base,
                                type: DashboardTileTypes.MARKDOWN,
                                properties: {
                                    ...commonProperties,
                                    content: content || '',
                                },
                            };
                        case DashboardTileTypes.LOOM:
                            return <DashboardLoomTile>{
                                ...base,
                                type: DashboardTileTypes.LOOM,
                                properties: {
                                    ...commonProperties,
                                    url: url || '',
                                },
                            };
                        default: {
                            return assertUnreachable(
                                type,
                                new UnexpectedServerError(
                                    `Dashboard tile type "${type}" not recognised`,
                                ),
                            );
                        }
                    }
                },
            ),
            filters: view?.filters || {
                dimensions: [],
                metrics: [],
                tableCalculations: [],
            },
            spaceUuid: dashboard.space_uuid,
            spaceName: dashboard.space_name,
            views: parseInt(dashboard.views, 10) || 0,
            firstViewedAt: dashboard.first_viewed_at,
            updatedByUser: {
                userUuid: dashboard.user_uuid,
                firstName: dashboard.first_name,
                lastName: dashboard.last_name,
            },
        };
    }

    async create(
        spaceUuid: string,
        dashboard: CreateDashboard,
        user: Pick<SessionUser, 'userUuid'>,
        projectUuid: string,
    ): Promise<Dashboard> {
        const dashboardId = await this.database.transaction(async (trx) => {
            const [space] = await trx(SpaceTableName)
                .where('space_uuid', spaceUuid)
                .select('spaces.*')
                .limit(1);
            if (!space) {
                throw new NotFoundError('Space not found');
            }
            const [newDashboard] = await trx(DashboardsTableName)
                .insert({
                    name: dashboard.name,
                    description: dashboard.description,
                    space_id: space.space_id,
                })
                .returning(['dashboard_id', 'dashboard_uuid']);

            await DashboardModel.createVersion(trx, newDashboard.dashboard_id, {
                ...dashboard,
                updatedByUser: user,
            });

            return newDashboard.dashboard_uuid;
        });
        return this.getById(dashboardId);
    }

    async update(
        dashboardUuid: string,
        dashboard: DashboardUnversionedFields,
    ): Promise<Dashboard> {
        const withSpaceId = dashboard.spaceUuid
            ? { space_id: await getSpaceId(this.database, dashboard.spaceUuid) }
            : {};
        await this.database(DashboardsTableName)
            .update({
                name: dashboard.name,
                description: dashboard.description,
                ...withSpaceId,
            })
            .where('dashboard_uuid', dashboardUuid);
        return this.getById(dashboardUuid);
    }

    async updateMultiple(
        projectUuid: string,
        dashboards: UpdateMultipleDashboards[],
    ): Promise<Dashboard[]> {
        await this.database.transaction(async (trx) => {
            await Promise.all(
                dashboards.map(async (dashboard) => {
                    const withSpaceId = dashboard.spaceUuid
                        ? {
                              space_id: await getSpaceId(
                                  this.database,
                                  dashboard.spaceUuid,
                              ),
                          }
                        : {};
                    await trx(DashboardsTableName)
                        .update({
                            name: dashboard.name,
                            description: dashboard.description,
                            ...withSpaceId,
                        })
                        .where('dashboard_uuid', dashboard.uuid);
                }),
            );
        });

        return Promise.all(
            dashboards.map(async (dashboard) => this.getById(dashboard.uuid)),
        );
    }

    async delete(dashboardUuid: string): Promise<Dashboard> {
        const dashboard = await this.getById(dashboardUuid);
        await this.database(DashboardsTableName)
            .where('dashboard_uuid', dashboardUuid)
            .delete();
        return dashboard;
    }

    async addVersion(
        dashboardUuid: string,
        version: DashboardVersionedFields,
        user: Pick<SessionUser, 'userUuid'>,
        projectUuid: string,
    ): Promise<Dashboard> {
        const [dashboard] = await this.database(DashboardsTableName)
            .select(['dashboard_id'])
            .where('dashboard_uuid', dashboardUuid)
            .limit(1);
        if (!dashboard) {
            throw new NotFoundError('Dashboard not found');
        }
        await this.database.transaction(async (trx) => {
            await DashboardModel.createVersion(trx, dashboard.dashboard_id, {
                ...version,
                updatedByUser: user,
            });
        });
        return this.getById(dashboardUuid);
    }

    async getOrphanedCharts(
        dashboardUuid: string,
    ): Promise<Pick<SavedChart, 'uuid'>[]> {
        const getLastVersionIdQuery = this.database(DashboardsTableName)
            .leftJoin(
                DashboardVersionsTableName,
                `${DashboardsTableName}.dashboard_id`,
                `${DashboardVersionsTableName}.dashboard_id`,
            )
            .select([`${DashboardVersionsTableName}.dashboard_version_id`])
            .where(`${DashboardsTableName}.dashboard_uuid`, dashboardUuid)
            .orderBy(`${DashboardVersionsTableName}.created_at`, 'desc')
            .limit(1);

        const getChartsInTilesQuery = this.database(DashboardTileChartTableName)
            .select(`saved_chart_id`)
            .where(
                `${DashboardTileChartTableName}.dashboard_version_id`,
                getLastVersionIdQuery,
            );
        const orphanedCharts = await this.database(SavedChartsTableName)
            .select(`saved_query_uuid`)
            .where(`${SavedChartsTableName}.dashboard_uuid`, dashboardUuid)
            .whereNotIn(`saved_query_id`, getChartsInTilesQuery);

        return orphanedCharts.map((chart) => ({
            uuid: chart.saved_query_uuid,
        }));
    }

    async findInfoForDbtExposures(projectUuid: string): Promise<
        Array<
            Pick<Dashboard, 'uuid' | 'name' | 'description'> &
                Pick<LightdashUser, 'firstName' | 'lastName'> & {
                    chartUuids: string[] | null;
                }
        >
    > {
        return this.database
            .table(DashboardsTableName)
            .leftJoin(
                DashboardVersionsTableName,
                `${DashboardsTableName}.dashboard_id`,
                `${DashboardVersionsTableName}.dashboard_id`,
            )
            .leftJoin(
                DashboardTileChartTableName,
                `${DashboardTileChartTableName}.dashboard_version_id`,
                `${DashboardVersionsTableName}.dashboard_version_id`,
            )
            .leftJoin(
                SavedChartsTableName,
                `${DashboardTileChartTableName}.saved_chart_id`,
                `${SavedChartsTableName}.saved_query_id`,
            )
            .leftJoin(
                SpaceTableName,
                `${DashboardsTableName}.space_id`,
                `${SpaceTableName}.space_id`,
            )
            .leftJoin(
                UserTableName,
                `${UserTableName}.user_uuid`,
                `${DashboardVersionsTableName}.updated_by_user_uuid`,
            )
            .innerJoin(
                ProjectTableName,
                `${SpaceTableName}.project_id`,
                `${ProjectTableName}.project_id`,
            )
            .select({
                uuid: `${DashboardsTableName}.dashboard_uuid`,
                name: `${DashboardsTableName}.name`,
                description: `${DashboardsTableName}.description`,
                firstName: `${UserTableName}.first_name`,
                lastName: `${UserTableName}.last_name`,
                chartUuids: this.database.raw(
                    'ARRAY_AGG(DISTINCT saved_queries.saved_query_uuid) FILTER (WHERE saved_queries.saved_query_uuid IS NOT NULL)',
                ),
            })
            .orderBy([
                {
                    column: `${DashboardVersionsTableName}.dashboard_id`,
                },
                {
                    column: `${DashboardVersionsTableName}.created_at`,
                    order: 'desc',
                },
            ])
            .groupBy(
                `${DashboardsTableName}.dashboard_uuid`,
                `${DashboardsTableName}.name`,
                `${DashboardsTableName}.description`,
                `${UserTableName}.first_name`,
                `${UserTableName}.last_name`,
                `${DashboardVersionsTableName}.dashboard_id`,
                `${DashboardVersionsTableName}.created_at`,
            )
            .distinctOn(`${DashboardVersionsTableName}.dashboard_id`)
            .where(`${ProjectTableName}.project_uuid`, projectUuid);
    }

    private async checkDashboardTileExistsInDashboard(
        dashboardUuid: string,
        dashboardTileUuid: string,
    ) {
        // NOTE: ensure that this dashboard actually contains the tile, since tile uuids might not be unique across dashboards
        const dashboardTile = await this.database(DashboardTilesTableName)
            .join(
                DashboardVersionsTableName,
                `${DashboardVersionsTableName}.dashboard_version_id`,
                '=',
                `${DashboardTilesTableName}.dashboard_version_id`,
            )
            .join(
                DashboardsTableName,
                `${DashboardsTableName}.dashboard_id`,
                '=',
                `${DashboardVersionsTableName}.dashboard_id`,
            )
            .where(`${DashboardsTableName}.dashboard_uuid`, dashboardUuid)
            .andWhere(
                `${DashboardTilesTableName}.dashboard_tile_uuid`,
                dashboardTileUuid,
            )
            .select(`${DashboardTilesTableName}.dashboard_tile_uuid`)
            .first();

        if (!dashboardTile) {
            throw new NotFoundError('Dashboard tile not found for dashboard');
        }
    }

    async createComment(
        dashboardUuid: string,
        dashboardTileUuid: string,
        text: string,
        replyTo: string | null,
        user: LightdashUser,
    ): Promise<string> {
        await this.checkDashboardTileExistsInDashboard(
            dashboardUuid,
            dashboardTileUuid,
        );
        const [{ comment_id: commentId }] = await this.database(
            DashboardTileCommentsTableName,
        )
            .insert({
                text,
                dashboard_tile_uuid: dashboardTileUuid,
                reply_to: replyTo ?? null,
                user_uuid: user.userUuid,
            })
            .returning('comment_id');

        return commentId;
    }

    async findCommentsForDashboard(
        dashboardUuid: string,
        userUuid: string,
        canUserRemoveAnyComment: boolean,
    ): Promise<Record<string, Comment[]>> {
        const dashboard = await this.getById(dashboardUuid);

        const tileUuids = dashboard.tiles.map((tile) => tile.uuid);

        const commentsWithUsers = await this.database(
            DashboardTileCommentsTableName,
        )
            .leftJoin(
                UserTableName,
                `${DashboardTileCommentsTableName}.user_uuid`,
                '=',
                `${UserTableName}.user_uuid`,
            )
            .select(
                `${DashboardTileCommentsTableName}.*`,
                `${UserTableName}.first_name`,
                `${UserTableName}.last_name`,
                `${DashboardTileCommentsTableName}.dashboard_tile_uuid`,
            )
            .whereIn(
                `${DashboardTileCommentsTableName}.dashboard_tile_uuid`,
                tileUuids,
            )
            .andWhere(`${DashboardTileCommentsTableName}.resolved`, false);

        const commentsPerDashboardTile: Record<string, Comment[]> = {}; // Stores comments grouped by their dashboard_tile_uuid
        const allComments: Record<string, Comment> = {}; // Fast access lookup for parent comments
        const orphanReplies: Record<string, Comment[]> = {}; // Stores orphan replies keyed by their intended parent's commentId

        commentsWithUsers.forEach((comment) => {
            const uuid = comment.dashboard_tile_uuid;
            if (!commentsPerDashboardTile[uuid]) {
                commentsPerDashboardTile[uuid] = [];
            }

            const structuredComment: Comment = {
                commentId: comment.comment_id,
                text: comment.text,
                replyTo: comment.reply_to ?? undefined,
                user: { name: `${comment.first_name} ${comment.last_name}` },
                createdAt: comment.created_at,
                resolved: comment.resolved,
                replies: [],
                canRemove:
                    canUserRemoveAnyComment || comment.user_uuid === userUuid,
            };

            // Directly attach to parent if it's a reply and the parent exists
            if (
                structuredComment.replyTo &&
                allComments[structuredComment.replyTo]
            ) {
                allComments[structuredComment.replyTo].replies?.push(
                    structuredComment,
                );
            } else {
                if (!structuredComment.replyTo) {
                    // For comments that are not replies, add them to the list
                    commentsPerDashboardTile[uuid].push(structuredComment);
                }
                // Store the comment for future reference
                allComments[structuredComment.commentId] = structuredComment;
            }

            // Add the orphan replies to their intended parent if it exists
            if (orphanReplies[structuredComment.commentId]) {
                orphanReplies[structuredComment.commentId].forEach(
                    (orphanReply) => {
                        structuredComment.replies?.push(orphanReply);
                    },
                );

                delete orphanReplies[structuredComment.commentId];
            }

            // If the comment that this reply is intended for doesn't exist yet, store it as an orphan
            if (
                structuredComment.replyTo &&
                !allComments[structuredComment.replyTo]
            ) {
                if (!orphanReplies[structuredComment.replyTo]) {
                    orphanReplies[structuredComment.replyTo] = [];
                }
                orphanReplies[structuredComment.replyTo].push(
                    structuredComment,
                );
            }
        });

        return commentsPerDashboardTile;
    }

    async findCommentsForDashboardTile(
        dashboardUuid: string,
        dashboardTileUuid: string,
        userUuid: string,
        canUserRemoveAnyComment: boolean,
    ): Promise<Comment[]> {
        this.checkDashboardTileExistsInDashboard(
            dashboardUuid,
            dashboardTileUuid,
        );

        const commentsWithUsers = await this.database(
            DashboardTileCommentsTableName,
        )
            .leftJoin(
                UserTableName,
                `${DashboardTileCommentsTableName}.user_uuid`,
                '=',
                `${UserTableName}.user_uuid`,
            )
            .select(
                `${DashboardTileCommentsTableName}.*`,
                `${UserTableName}.first_name`,
                `${UserTableName}.last_name`,
            )
            .where(
                `${DashboardTileCommentsTableName}.dashboard_tile_uuid`,
                dashboardTileUuid,
            )
            .andWhere(`${DashboardTileCommentsTableName}.resolved`, false);

        const commentMap: Record<string, Comment> = {};
        const topLevelComments: Comment[] = [];
        commentsWithUsers.forEach((comment) => {
            const fullComment: Comment = {
                commentId: comment.comment_id,
                text: comment.text,
                replyTo: comment.reply_to ?? undefined,
                user: {
                    name: `${comment.first_name} ${comment.last_name}`,
                },
                createdAt: comment.created_at,
                resolved: comment.resolved,
                replies: [],
                canRemove:
                    canUserRemoveAnyComment || comment.user_uuid === userUuid,
            };

            commentMap[fullComment.commentId] = fullComment;
            if (fullComment.replyTo) {
                commentMap[fullComment.replyTo]?.replies?.push(fullComment);
            } else {
                topLevelComments.push(fullComment);
            }
        });

        return topLevelComments;
    }

    async resolveComment(commentId: string): Promise<void> {
        await this.database(DashboardTileCommentsTableName)
            .update({ resolved: true })
            .where('comment_id', commentId);
    }

    async getCommentOwner(commentId: string): Promise<string | null> {
        const result = await this.database(DashboardTileCommentsTableName)
            .select<Pick<DbDashboardTileComments, 'user_uuid'>>('user_uuid')
            .where('comment_id', commentId)
            .first();

        return result ? result.user_uuid : null;
    }

    async deleteComment(commentId: string): Promise<void> {
        await this.database(DashboardTileCommentsTableName)
            .delete()
            .where('reply_to', commentId)
            .orWhere('comment_id', commentId);
    }
}
