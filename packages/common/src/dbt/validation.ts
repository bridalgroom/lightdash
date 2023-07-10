import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { AnyValidateFunction } from 'ajv/dist/types';
import {
    DbtManifestVersion,
    DbtMetric,
    DbtModelNode,
    DbtRawModelNode,
} from '../types/dbt';
import { ParseError } from '../types/errors';
import lightdashMetadataSchema from './schemas/lightdashMetadata.json';
import lightdashSchemaV8 from './schemas/lightdashV8.json';
import lightdashSchemaV9 from './schemas/lightdashV9.json';
import dbtManifestSchemaV8 from './schemas/manifestV8.json';
import dbtManifestSchemaV9 from './schemas/manifestV9.json';

const ajv = new Ajv({
    schemas: [
        dbtManifestSchemaV8,
        dbtManifestSchemaV9,
        lightdashMetadataSchema,
        lightdashSchemaV8,
        lightdashSchemaV9,
    ],
});

addFormats(ajv);

export class ManifestValidator {
    private readonly schemaId: string;

    constructor(manifestVersion: DbtManifestVersion) {
        this.schemaId = `https://schemas.lightdash.com/lightdash/${manifestVersion}.json`;
    }

    static isValid = (
        validator: ValidateFunction<any>,
        data: any,
    ): [true, undefined] | [false, string] => {
        const isValid = validator(data);
        if (!isValid) {
            return [false, ManifestValidator.formatAjvErrors(validator)];
        }
        return [true, undefined];
    };

    static formatAjvErrors = (validator: AnyValidateFunction): string =>
        (validator.errors || [])
            .map((err) => `Field at "${err.instancePath}" ${err.message}`)
            .join('\n');

    static getValidator = <T>(schemaRef: string) => {
        const validator = ajv.getSchema<T>(schemaRef);
        if (validator === undefined) {
            throw new ParseError(
                `Could not find schema with reference: ${schemaRef}`,
            );
        }
        return validator;
    };

    isModelValid = (
        model: DbtRawModelNode,
    ): [true, undefined] | [false, string] => {
        const validator = ManifestValidator.getValidator<DbtModelNode>(
            `${this.schemaId}#/definitions/LightdashCompiledModelNode`,
        );
        return ManifestValidator.isValid(validator, model);
    };

    isDbtMetricValid = (
        metric: DbtMetric,
    ): [true, undefined] | [false, string] => {
        const validator = ManifestValidator.getValidator<DbtMetric>(
            `${this.schemaId}#/definitions/LightdashMetric`,
        );
        return ManifestValidator.isValid(validator, metric);
    };
}
