import { ProjectType, TableSelectionType } from 'common';
import { Knex } from 'knex';

export const ProjectTableName = 'projects';
export const CachedExploresTableName = 'cached_explores';
export const CachedWarehouseTableName = 'cached_warehouse';
export const JobsTableName = 'jobs';

type DbProject = {
    project_id: number;
    project_uuid: string;
    name: string;
    created_at: Date;
    organization_id: number;
    dbt_connection_type: ProjectType | null;
    dbt_connection: Buffer | null;
    table_selection_type: TableSelectionType;
    table_selection_value: string[] | null;
};

type CreateDbProject = Pick<
    DbProject,
    'name' | 'organization_id' | 'dbt_connection' | 'dbt_connection_type'
>;
type UpdateDbProject = Partial<
    Pick<
        DbProject,
        | 'name'
        | 'dbt_connection'
        | 'dbt_connection_type'
        | 'table_selection_type'
        | 'table_selection_value'
    >
>;

export type ProjectTable = Knex.CompositeTableType<
    DbProject,
    CreateDbProject,
    UpdateDbProject
>;

export type DbCachedExplores = {
    project_uuid: string;
    explores: any;
};

export type CachedExploresTable = Knex.CompositeTableType<DbCachedExplores>;

export type DbCachedWarehouse = {
    project_uuid: string;
    warehouse: any;
};

export type CachedWarehouseTable = Knex.CompositeTableType<DbCachedWarehouse>;
