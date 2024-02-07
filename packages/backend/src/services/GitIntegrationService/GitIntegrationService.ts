import {
    DbtModelNode,
    DbtProjectType,
    DimensionType,
    findAndUpdateModelNodes,
    GitIntegrationConfiguration,
    lightdashDbtYamlSchema,
    ParseError,
    PullRequestCreated,
    SessionUser,
} from '@lightdash/common';
import Ajv from 'ajv';
import * as yaml from 'js-yaml';
import { get, update } from 'lodash';
import {
    createBranch,
    getFileContent,
    updateFile,
} from '../../clients/github/Github';
import { LightdashConfig } from '../../config/parseConfig';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';

type Dependencies = {
    lightdashConfig: LightdashConfig;
    savedChartModel: SavedChartModel;
    projectModel: ProjectModel;
};

// TODO move this to common and refactor cli
type YamlColumnMeta = {
    dimension?: {
        type?: DimensionType;
    };
};

type YamlColumn = {
    name: string;
    description?: string;
    meta?: YamlColumnMeta;
};

export type YamlModel = {
    name: string;
    description?: string;
    columns?: YamlColumn[];
    meta?: any;
};

export type YamlSchema = {
    version?: number;
    models?: DbtModelNode[];
};

export class GitIntegrationService {
    private readonly lightdashConfig: LightdashConfig;

    private readonly savedChartModel: SavedChartModel;

    private readonly projectModel: ProjectModel;

    constructor({
        lightdashConfig,
        savedChartModel,
        projectModel,
    }: Dependencies) {
        this.lightdashConfig = lightdashConfig;
        this.savedChartModel = savedChartModel;
        this.projectModel = projectModel;
    }

    async getConfiguration(
        user: SessionUser,
        projectUuid: string,
    ): Promise<GitIntegrationConfiguration> {
        // to remove
        console.log(this.lightdashConfig);
        // TODO: check if git integration is enabled
        const configuration = {
            enabled: true,
        };
        return configuration;
    }

    private static async loadYamlSchema(content: any): Promise<YamlSchema> {
        const schemaFile = yaml.load(content);

        const ajvCompiler = new Ajv({ coerceTypes: true });

        const validate = ajvCompiler.compile<YamlSchema>(
            lightdashDbtYamlSchema,
        );
        if (schemaFile === undefined) {
            return {
                version: 2,
            };
        }
        console.log('schema file', schemaFile);
        if (!validate(schemaFile)) {
            throw new ParseError(`Not valid schema ${validate}`);
        }
        return schemaFile;
    }

    async createPullRequestForChartFields(
        user: SessionUser,
        projectUuid: string,
        chartUuid: string,
    ): Promise<PullRequestCreated> {
        // TODO: check user permissions, only editors and above?
        // get chart -> get custom metrics
        const project = await this.projectModel.get(projectUuid);

        if (project.dbtConnection.type !== DbtProjectType.GITHUB)
            throw new Error(
                `invalid dbt connection type ${project.dbtConnection.type} for project ${project.name}`,
            );

        const [owner, repo] = project.dbtConnection.repository.split('/');
        const { branch } = project.dbtConnection;
        const chart = await this.savedChartModel.get(chartUuid);
        const customMetrics = chart.metricQuery.additionalMetrics;
        const fileName = 'models/schema.yml'; // TODO hardcoded: replace with the right file

        if (customMetrics === undefined || customMetrics?.length === 0)
            throw new Error('No custom metrics found');

        // get yml from github
        const { content: fileContent, sha: fileSha } = await getFileContent({
            fileName,
            owner,
            repo,
            branch,
        });

        const yamlSchema = await GitIntegrationService.loadYamlSchema(
            fileContent,
        );

        if (!yamlSchema.models)
            throw new Error(`Models not found ${yamlSchema}`);

        // call util function findAndUpdateModelNodes()
        const updatedModels = findAndUpdateModelNodes(
            yamlSchema.models,
            customMetrics,
        );

        // update yml
        const updatedYml = yaml.dump(
            { ...yamlSchema, models: updatedModels },
            {
                quotingType: "'",
            },
        );

        // create branch in git
        const branchName = `add-custom-metrics-${Date.now()}`;
        const newBranch = await createBranch({
            branchName,
            owner,
            repo,
            sha: fileSha,
        });
        const prTitle = `Added ${customMetrics.length} custom metrics from chart ${chart.name}`;

        console.log('update', updatedYml);
        const fileUpdated = await updateFile({
            fileName,
            content: updatedYml,
            fileSha,
            branchName,
            message: prTitle,
        });

        // TODO should we use the api to get the link to the PR ?
        const prUrl = `https://github.com/${owner}/${repo}/compare/main...${owner}:${repo}:${branchName}?expand=1`;
        return {
            prTitle,
            prUrl,
        };
    }
}
