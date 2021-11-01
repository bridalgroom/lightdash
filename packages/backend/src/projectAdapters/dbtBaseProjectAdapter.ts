import { DbtModelNode, Explore, ExploreError } from 'common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
    attachTypesToModels,
    convertExplores,
    getSchemaStructureFromDbtModels,
} from '../dbt/translator';
import { MissingCatalogEntryError, ParseError } from '../errors';
import modelJsonSchema from '../schema.json';
import {
    DbtClient,
    ProjectAdapter,
    WarehouseClient,
    WarehouseCatalog,
} from '../types';

const ajv = new Ajv();
addFormats(ajv);

export class DbtBaseProjectAdapter implements ProjectAdapter {
    dbtClient: DbtClient;

    warehouseClient: WarehouseClient;

    warehouseSchema: WarehouseCatalog | undefined;

    constructor(dbtClient: DbtClient, warehouseClient: WarehouseClient) {
        this.dbtClient = dbtClient;
        this.warehouseClient = warehouseClient;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,class-methods-use-this
    async destroy(): Promise<void> {}

    public async test(): Promise<void> {
        await this.dbtClient.test();
        await this.warehouseClient.test();
    }

    public async compileAllExplores(
        loadSources: boolean = false,
    ): Promise<(Explore | ExploreError)[]> {
        // Install dependencies for dbt and fetch the manifest - may raise error meaning no explores compile
        await this.dbtClient.installDeps();
        const { manifest } = await this.dbtClient.getDbtManifest();

        // Type of the target warehouse
        const adapterType = manifest.metadata.adapter_type;

        // Validate models in the manifest - models with invalid metadata will compile to failed Explores
        const models = Object.values(manifest.nodes).filter(
            (node) => node.resource_type === 'model',
        ) as DbtModelNode[];
        const [validModels, failedExplores] =
            await DbtBaseProjectAdapter._validateDbtModelMetadata(models);

        // Be lazy and try to attach types to the remaining models without refreshing the catalog
        try {
            const lazyTypedModels = attachTypesToModels(
                validModels,
                this.warehouseSchema || {},
                true,
            );
            const lazyExplores = await convertExplores(
                lazyTypedModels,
                loadSources,
                adapterType,
            );
            return [...lazyExplores, ...failedExplores];
        } catch (e) {
            if (e instanceof MissingCatalogEntryError) {
                this.warehouseSchema = await this.warehouseClient.getCatalog(
                    getSchemaStructureFromDbtModels(validModels),
                );
                // Some types were missing so refresh the schema and try again
                const typedModels = attachTypesToModels(
                    validModels,
                    this.warehouseSchema,
                    false,
                );
                const explores = await convertExplores(
                    typedModels,
                    loadSources,
                    adapterType,
                );
                return [...explores, ...failedExplores];
            }
            throw e;
        }
    }

    public async runQuery(sql: string): Promise<Record<string, any>[]> {
        // Possible error if query is ran before dependencies are installed
        return this.warehouseClient.runQuery(sql);
    }

    static async _validateDbtModelMetadata(
        models: DbtModelNode[],
    ): Promise<[DbtModelNode[], ExploreError[]]> {
        const validator = ajv.compile(modelJsonSchema);
        return models.reduce(
            ([validModels, invalidModels], model) => {
                const isValid = validator(model);
                if (isValid) {
                    return [[...validModels, model], invalidModels];
                }
                const exploreError: ExploreError = {
                    name: model.name,
                    errors: [
                        {
                            type: 'MetadataParseError',
                            message: (validator.errors || [])
                                .map(
                                    (err) =>
                                        `Field at "${err.instancePath}" ${err.message}`,
                                )
                                .join('\n'),
                        },
                    ],
                };
                return [validModels, [...invalidModels, exploreError]];
            },
            [[] as DbtModelNode[], [] as ExploreError[]],
        );
    }

    static async _unused(models: DbtModelNode[]): Promise<DbtModelNode[]> {
        const validator = ajv.compile(modelJsonSchema);
        const validateModel = (model: DbtModelNode) => {
            const valid = validator(model);
            if (!valid) {
                const lineErrorMessages = (validator.errors || [])
                    .map((err) => `Field at ${err.instancePath} ${err.message}`)
                    .join('\n');
                throw new ParseError(
                    `Cannot parse lightdash metadata from schema.yml for model "${model.name}":\n${lineErrorMessages}`,
                    {
                        schema: modelJsonSchema.$id,
                        errors: validator.errors,
                    },
                );
            }
        };
        models.forEach(validateModel);
        return models;
    }
}
