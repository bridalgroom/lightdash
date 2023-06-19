import * as pg from 'pg';
import { PassThrough } from 'stream';
import { PostgresWarehouseClient } from './PostgresWarehouseClient';
import {
    columns,
    credentials,
    queryColumnsMock,
} from './PostgresWarehouseClient.mock';
import {
    config,
    expectedFields,
    expectedRow,
    expectedWarehouseSchema,
} from './WarehouseClient.mock';

jest.mock('pg', () => ({
    ...jest.requireActual('pg'),
    Pool: jest.fn(() => ({
        query: jest.fn(() => ({
            fields: queryColumnsMock,
            rows: [expectedRow],
        })),
        connect: jest.fn((callback) => {
            callback(
                null,
                {
                    query: jest.fn(() => {
                        const mockedStream = new PassThrough();
                        setTimeout(() => {
                            mockedStream.emit('data', expectedRow);
                            mockedStream.end();
                        }, 100);
                        return mockedStream;
                    }),
                },
                jest.fn(),
            );
        }),
        end: jest.fn(),
    })),
}));

describe('PostgresWarehouseClient', () => {
    it('expect query rows', async () => {
        const warehouse = new PostgresWarehouseClient(credentials);
        const results = await warehouse.runQuery('fake sql');
        expect(results.fields).toEqual(expectedFields);
        expect(results.rows[0]).toEqual(expectedRow);
    });
    it('expect schema with postgres types mapped to dimension types', async () => {
        const warehouse = new PostgresWarehouseClient(credentials);
        (pg.Pool as unknown as jest.Mock).mockImplementationOnce(() => ({
            query: jest.fn(() => ({
                fields: queryColumnsMock,
                rows: columns,
            })),
            connect: jest.fn((callback) => {
                callback(
                    null,
                    {
                        query: jest.fn(() => {
                            const mockedStream = new PassThrough();
                            setTimeout(() => {
                                columns.forEach((column) => {
                                    mockedStream.emit('data', column);
                                });
                                mockedStream.end();
                            }, 100);
                            return mockedStream;
                        }),
                    },
                    jest.fn(),
                );
            }),
            end: jest.fn(),
        }));
        expect(await warehouse.getCatalog(config)).toEqual(
            expectedWarehouseSchema,
        );
    });
    it('expect empty catalog when dbt project has no references', async () => {
        const warehouse = new PostgresWarehouseClient(credentials);
        expect(await warehouse.getCatalog([])).toEqual({});
    });
});
