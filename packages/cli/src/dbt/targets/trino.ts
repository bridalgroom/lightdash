import {
    CreateTrinoCredentials,
    ParseError,
    WarehouseTypes,
} from '@lightdash/common';
import { JSONSchemaType } from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
import { ajv } from '../../ajv';
import { Target } from '../types';

export type TrinoTarget = {
    type: 'trino';
    host: string;
    user: string;
    password: string;
    port: number;
    database: string;
    schema: string;
};

export const trinoSchema: JSONSchemaType<TrinoTarget> = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ['trino'],
        },
        schema: {
            type: 'string',
        },
        host: {
            type: 'string',
        },
        user: {
            type: 'string',
        },
        password: {
            type: 'string',
        },
        port: {
            type: 'number',
        },
        database: {
            type: 'string',
        },
    },
    required: [
        'type',
        'schema',
        'host',
        'user',
        'password',
        'port',
        'database',
    ],
};

export const convertTrinoSchema = (target: Target): CreateTrinoCredentials => {
    const validate = ajv.compile<TrinoTarget>(trinoSchema);

    if (validate(target)) {
        const teste: CreateTrinoCredentials = {
            type: WarehouseTypes.TRINO,
            schema: target.schema,
            host: target.host,
            user: target.user,
            password: target.password,
            port: target.port,
            dbname: target.database,
        };

        return teste;
    }

    const errs = betterAjvErrors(trinoSchema, target, validate.errors || []);
    throw new ParseError(
        `Couldn't read profiles.yml file for ${target.type}:\n${errs}`,
    );
};
