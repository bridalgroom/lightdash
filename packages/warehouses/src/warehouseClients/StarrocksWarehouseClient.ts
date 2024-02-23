import {
    CreateStarrocksCredentials,
    DimensionType,
    Metric,
    MetricType,
    SupportedDbtAdapter,
    WarehouseConnectionError,
    WarehouseQueryError,
} from '@lightdash/common';
import {
    Connection,
    ConnectionOptions,
    FieldPacket,
    RowDataPacket,
    createConnection
} from 'mysql2/promise';
import { WarehouseCatalog } from '../types';
import WarehouseBaseClient from './WarehouseBaseClient';

export enum StarrocksTypes {
    BOOLEAN = 'boolean',
    TINYINT = 'tinyint',
    SMALLINT = 'smallint',
    INTEGER = 'integer',
    BIGINT = 'bigint',
    REAL = 'real',
    DOUBLE = 'double',
    DECIMAL = 'decimal',
    VARCHAR = 'varchar',
    CHAR = 'char',
    VARBINARY = 'varbinary',
    JSON = 'json',
    DATE = 'date',
    TIME = 'time',
    TIME_TZ = 'time with time zone',
    TIMESTAMP = 'timestamp',
    TIMESTAMP_TZ = 'timestamp with time zone',
    INTERVAL_YEAR_MONTH = 'interval year to month',
    INTERVAL_DAY_TIME = 'interval day to second',
    ARRAY = 'array',
    MAP = 'map',
    ROW = 'row',
    IPADDRESS = 'ipaddress',
    UUID = 'uuid',
}

interface TableInfo {
    database: string;
    schema: string;
    table: string;
}

const queryTableSchema = ({
    database,
    schema,
    table,
}: TableInfo) => `SELECT table_catalog
            , table_schema
            , table_name
            , column_name
            , data_type
    FROM ${database}.information_schema.columns
    WHERE table_catalog = '${database}'
        AND table_schema = '${schema}'
        AND table_name = '${table}'
    ORDER BY 1, 2, 3, ordinal_position`;

const convertDataTypeToDimensionType = (
    type: StarrocksTypes | string,
): DimensionType => {
    const typeWithoutTimePrecision = type.replace(/\(\d\)/, '');
    switch (typeWithoutTimePrecision) {
        case StarrocksTypes.BOOLEAN:
            return DimensionType.BOOLEAN;
        case StarrocksTypes.TINYINT:
            return DimensionType.NUMBER;
        case StarrocksTypes.SMALLINT:
            return DimensionType.NUMBER;
        case StarrocksTypes.INTEGER:
            return DimensionType.NUMBER;
        case StarrocksTypes.BIGINT:
            return DimensionType.NUMBER;
        case StarrocksTypes.REAL:
            return DimensionType.NUMBER;
        case StarrocksTypes.DOUBLE:
            return DimensionType.NUMBER;
        case StarrocksTypes.DECIMAL:
            return DimensionType.NUMBER;
        case StarrocksTypes.DATE:
            return DimensionType.DATE;
        case StarrocksTypes.TIMESTAMP:
            return DimensionType.TIMESTAMP;
        case StarrocksTypes.TIMESTAMP_TZ:
            return DimensionType.TIMESTAMP;
        default:
            return DimensionType.STRING;
    }
};

const catalogToSchema = (results: string[][][]): WarehouseCatalog => {
    const warehouseCatalog: WarehouseCatalog = {};
    Object.values(results).forEach((catalog) => {
        Object.values(catalog).forEach(
            ([
                table_catalog,
                table_schema,
                table_name,
                column_name,
                data_type,
            ]) => {
                warehouseCatalog[table_catalog] =
                    warehouseCatalog[table_catalog] || {};
                warehouseCatalog[table_catalog][table_schema] =
                    warehouseCatalog[table_catalog][table_schema] || {};
                warehouseCatalog[table_catalog][table_schema][table_name] =
                    warehouseCatalog[table_catalog][table_schema][table_name] ||
                    {};
                warehouseCatalog[table_catalog][table_schema][table_name][
                    column_name
                ] = convertDataTypeToDimensionType(data_type);
            },
        );
    });
    return warehouseCatalog;
};

const resultHandler = (schema: FieldPacket[], data: RowDataPacket[]) => {
    const s: string[] = schema.map((e) => e.name);
    // return data.map((i) => {
    //     const item: { [key: string]: any } = {};
    //     i.map((column, index) => {
    //         const name: string = s[index];
    //         item[name] = column;
    //         return null;
    //     });
    //     return item;
    // });
    return []
};

export class StarrocksWarehouseClient extends WarehouseBaseClient<CreateStarrocksCredentials> {
    connectionOptions: ConnectionOptions;

    constructor(credentials: CreateStarrocksCredentials) {
        super(credentials);
        this.connectionOptions = {
            user: credentials.user,
            password: credentials.password,
            database: credentials.dbname,
            debug: true,
            host: credentials.host,
            port: credentials.port,
        };
    }

    private async getSession() {
        let session: Connection;
        try {
            session = await createConnection(this.connectionOptions);
        } catch (e: any) {
            throw new WarehouseConnectionError(e.message);
        }

        return {
            session,
            close: async () => {
                console.info('Close starrocks connection');
            },
        };
    }

    private convertQueryResultFields(
        fields: FieldPacket[],
    ): Record<string, { type: DimensionType }> {
        return fields.reduce((agg, field) => ({
            ...agg,
            [field.name]: {
                type: field.type
            }
        }), {})
    }


    async runQuery(sql: string, tags?: Record<string, string>) {
        const { session, close } = await this.getSession();
        let result: RowDataPacket[]
        let fields: FieldPacket[];
        try {
            let alteredQuery = sql;
            if (tags) {
                alteredQuery = `${alteredQuery}\n-- ${JSON.stringify(tags)}`;
            }
            [result, fields] = await session.query<RowDataPacket[]>(sql);

            return {
                fields: this.convertQueryResultFields(fields),
                rows: resultHandler(fields, result)
            };
        } catch (e: any) {
            throw new WarehouseQueryError(e.message);
        } finally {
            await close();
        }
    }

    // TODO: Implement
    async getCatalog(requests: TableInfo[]): Promise<WarehouseCatalog> {
        const { session, close } = await this.getSession();
        let results: string[][][];

        return catalogToSchema([]);
    }

    getFieldQuoteChar() {
        return '"';
    }

    getStringQuoteChar() {
        return "'";
    }

    getEscapeStringQuoteChar() {
        return "'";
    }

    getAdapterType(): SupportedDbtAdapter {
        return SupportedDbtAdapter.STARROCKS;
    }

    getMetricSql(sql: string, metric: Metric) {
        switch (metric.type) {
            case MetricType.PERCENTILE:
                return `APPROX_PERCENTILE(${sql}, ${(metric.percentile ?? 50) / 100
                    })`;
            case MetricType.MEDIAN:
                return `APPROX_PERCENTILE(${sql},0.5)`;
            default:
                return super.getMetricSql(sql, metric);
        }
    }
}
