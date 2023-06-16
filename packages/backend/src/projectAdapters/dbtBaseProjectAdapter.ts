import {
    assertUnreachable,
    attachTypesToModels,
    convertExplores,
    DbtManifestVersion,
    DbtMetric,
    DbtModelNode,
    DbtPackages,
    DbtRawModelNode,
    Explore,
    ExploreError,
    friendlyName,
    getSchemaStructureFromDbtModels,
    InlineError,
    InlineErrorType,
    isSupportedDbtAdapter,
    MissingCatalogEntryError,
    normaliseModelDatabase,
    ParseError,
    SupportedDbtAdapter,
    UnexpectedServerError,
} from '@lightdash/common';
import { WarehouseClient } from '@lightdash/warehouses';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { AnyValidateFunction } from 'ajv/dist/types';
import Logger from '../logger';
import dbtManifestSchemaV7 from '../manifestv7.json';
import dbtManifestSchemaV9 from '../manifestv9.json';
import lightdashDbtSchemaV7 from '../schema.json';
import lightdashDbtSchemaV9 from '../schemav9.json';
import { CachedWarehouse, DbtClient, ProjectAdapter } from '../types';

let ajv: Ajv;

const getModelValidator = (manifestVersion: DbtManifestVersion) => {
    switch (manifestVersion) {
        case DbtManifestVersion.V7:
            ajv = new Ajv({
                schemas: [lightdashDbtSchemaV7, dbtManifestSchemaV7],
            });
            break;
        case DbtManifestVersion.V9:
            ajv = new Ajv({
                schemas: [lightdashDbtSchemaV9, dbtManifestSchemaV9],
            });
            break;
        default:
            return assertUnreachable(
                manifestVersion,
                new UnexpectedServerError(
                    `Missing dbt manifest version "${manifestVersion}" in validation.`,
                ),
            );
    }
    addFormats(ajv);

    const modelValidator = ajv.getSchema<DbtRawModelNode>(
        `https://schemas.lightdash.com/dbt/manifest/${manifestVersion}.json#/definitions/LightdashCompiledModelNode`,
    );
    if (modelValidator === undefined) {
        throw new ParseError('Could not parse Lightdash schema.');
    }
    return modelValidator;
};

const getMetricValidator = (manifestVersion: DbtManifestVersion) => {
    const schema = DbtManifestVersion.V9
        ? `https://schemas.getdbt.com/dbt/manifest/v9.json#/definitions/Metric`
        : `https://schemas.getdbt.com/dbt/manifest/v7.json#/definitions/ParsedMetric`;
    const metricValidator = ajv.getSchema<DbtMetric>(schema);
    if (metricValidator === undefined) {
        throw new ParseError('Could not parse dbt schema.');
    }
    return metricValidator;
};

const formatAjvErrors = (validator: AnyValidateFunction): string =>
    (validator.errors || [])
        .map((err) => `Field at "${err.instancePath}" ${err.message}`)
        .join('\n');

export class DbtBaseProjectAdapter implements ProjectAdapter {
    dbtClient: DbtClient;

    warehouseClient: WarehouseClient;

    cachedWarehouse: CachedWarehouse;

    constructor(
        dbtClient: DbtClient,
        warehouseClient: WarehouseClient,
        cachedWarehouse: CachedWarehouse,
    ) {
        this.dbtClient = dbtClient;
        this.warehouseClient = warehouseClient;
        this.cachedWarehouse = cachedWarehouse;
    }

    // eslint-disable-next-line class-methods-use-this
    async destroy(): Promise<void> {
        Logger.debug(`Destroy base project adapter`);
    }

    public async test(): Promise<void> {
        Logger.debug('Test dbt client');
        await this.dbtClient.test();
        Logger.debug('Test warehouse client');
        await this.warehouseClient.test();
    }

    public async getDbtPackages(): Promise<DbtPackages | undefined> {
        Logger.debug(`Get dbt packages`);
        if (this.dbtClient.getDbtPackages) {
            return this.dbtClient.getDbtPackages();
        }
        return undefined;
    }

    public async compileAllExplores(
        loadSources: boolean = false,
    ): Promise<(Explore | ExploreError)[]> {
        Logger.debug('Install dependencies');
        // Install dependencies for dbt and fetch the manifest - may raise error meaning no explores compile
        await this.dbtClient.installDeps();
        Logger.debug('Get dbt manifest');
        const {
            version,
            results: { manifest },
        } = await this.dbtClient.getDbtManifest();

        // Type of the target warehouse
        if (!isSupportedDbtAdapter(manifest.metadata)) {
            throw new ParseError(
                `Dbt project not supported. Lightdash does not support adapter ${manifest.metadata.adapter_type}`,
                {},
            );
        }
        const adapterType = manifest.metadata.adapter_type;

        // Validate models in the manifest - models with invalid metadata will compile to failed Explores
        const models = Object.values(manifest.nodes).filter(
            (node: any) => node.resource_type === 'model',
        ) as DbtRawModelNode[];
        Logger.debug(`Validate ${models.length} models in manifest`);
        const [validModels, failedExplores] =
            DbtBaseProjectAdapter._validateDbtModel(
                adapterType,
                models,
                version,
            );

        // Validate metrics in the manifest - compile fails if any invalid
        const metrics = DbtBaseProjectAdapter._validateDbtMetrics(
            version,
            Object.values(manifest.metrics),
        );

        // Be lazy and try to attach types to the remaining models without refreshing the catalog
        try {
            if (this.cachedWarehouse?.warehouseCatalog === undefined) {
                throw new MissingCatalogEntryError(
                    `Warehouse catalog is undefined`,
                    {},
                );
            }
            Logger.debug(`Attach types to ${validModels.length} models`);
            const lazyTypedModels = attachTypesToModels(
                validModels,
                this.cachedWarehouse.warehouseCatalog,
                true,
                adapterType !== 'snowflake',
            );
            Logger.debug('Convert explores');
            const lazyExplores = await convertExplores(
                lazyTypedModels,
                loadSources,
                adapterType,
                metrics,
                this.warehouseClient,
            );
            return [...lazyExplores, ...failedExplores];
        } catch (e) {
            if (e instanceof MissingCatalogEntryError) {
                Logger.debug(
                    'Get warehouse catalog after missing catalog error',
                );
                const modelCatalog =
                    getSchemaStructureFromDbtModels(validModels);
                Logger.debug(
                    `Fetching table metadata for ${modelCatalog.length} tables`,
                );

                const warehouseCatalog = await this.warehouseClient.getCatalog(
                    modelCatalog,
                );
                await this.cachedWarehouse?.onWarehouseCatalogChange(
                    warehouseCatalog,
                );

                Logger.debug(
                    'Attach types to models after missing catalog error',
                );
                // Some types were missing so refresh the schema and try again
                const typedModels = attachTypesToModels(
                    validModels,
                    warehouseCatalog,
                    false,
                    adapterType !== 'snowflake',
                );
                Logger.debug('Convert explores after missing catalog error');
                const explores = await convertExplores(
                    typedModels,
                    loadSources,
                    adapterType,
                    metrics,
                    this.warehouseClient,
                );
                return [...explores, ...failedExplores];
            }
            throw e;
        }
    }

    public async runQuery(sql: string) {
        Logger.debug(`Run query against warehouse`);
        // Possible error if query is ran before dependencies are installed
        return this.warehouseClient.runQuery(sql);
    }

    static _validateDbtMetrics(
        version: DbtManifestVersion,
        metrics: DbtMetric[],
    ): DbtMetric[] {
        const validator = getMetricValidator(version);
        metrics.forEach((metric) => {
            const isValid = validator(metric);
            if (isValid !== true) {
                throw new ParseError(
                    `Could not parse dbt metric with id ${
                        metric.unique_id
                    }: ${formatAjvErrors(validator)}`,
                    {},
                );
            }
        });
        return metrics;
    }

    static _validateDbtModel(
        adapterType: SupportedDbtAdapter,
        models: DbtRawModelNode[],
        manifestVersion: DbtManifestVersion,
    ): [DbtModelNode[], ExploreError[]] {
        const validator = getModelValidator(manifestVersion);
        return models.reduce(
            ([validModels, invalidModels], model) => {
                let error: InlineError | undefined;
                // Match against json schema
                const isValid = validator(model);
                if (!isValid) {
                    error = {
                        type: InlineErrorType.METADATA_PARSE_ERROR,
                        message: formatAjvErrors(validator),
                    };
                } else if (
                    isValid &&
                    Object.values(model.columns).length <= 0
                ) {
                    error = {
                        type: InlineErrorType.NO_DIMENSIONS_FOUND,
                        message: 'No dimensions available',
                    };
                }
                if (error) {
                    const exploreError: ExploreError = {
                        name: model.name,
                        label: model.meta.label || friendlyName(model.name),
                        groupLabel: model.meta.group_label,
                        errors: [
                            error.type === InlineErrorType.METADATA_PARSE_ERROR
                                ? {
                                      ...error,
                                      message: `${
                                          model.name ? `${model.name}: ` : ''
                                      }${error.message}`,
                                  }
                                : error,
                        ],
                    };
                    return [validModels, [...invalidModels, exploreError]];
                }
                // Fix null databases
                const validatedModel = normaliseModelDatabase(
                    model,
                    adapterType,
                );
                return [[...validModels, validatedModel], invalidModels];
            },
            [[] as DbtModelNode[], [] as ExploreError[]],
        );
    }
}
