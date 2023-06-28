import {
    AuthorizationError,
    Explore,
    ExploreError,
    friendlyName,
    isExploreError,
    Project,
    ProjectType,
} from '@lightdash/common';
import inquirer from 'inquirer';
import path from 'path';
import { URL } from 'url';
import { LightdashAnalytics } from '../analytics/analytics';
import { getConfig, setProject } from '../config';
import { getDbtContext } from '../dbt/context';
import GlobalState from '../globalState';
import * as styles from '../styles';
import { compile } from './compile';
import { createProject } from './createProject';
import { checkLightdashVersion, lightdashApi } from './dbt/apiClient';
import { DbtCompileOptions } from './dbt/compile';

type DeployHandlerOptions = DbtCompileOptions & {
    name?: string;
    projectDir: string;
    profilesDir: string;
    target: string | undefined;
    profile: string | undefined;
    create?: boolean;
    verbose: boolean;
    ignoreErrors: boolean;
    startOfWeek?: number;
};

type DeployArgs = DeployHandlerOptions & {
    projectUuid: string;
};

// Get the default project whose name is the given name
const getDefaultProject = async (
    name: string,
): Promise<Project | undefined> => {
    const projects = await lightdashApi<Project[]>({
        method: 'GET',
        url: `/api/v1/org/projects/`,
        body: undefined,
    });
    return projects.find(
        (project) =>
            project.type === ProjectType.DEFAULT && project.name === name,
    );
};

export const deploy = async (
    explores: (Explore | ExploreError)[],
    options: DeployArgs,
): Promise<void> => {
    const errors = explores.filter((e) => isExploreError(e)).length;
    if (errors > 0) {
        if (options.ignoreErrors) {
            console.error(
                styles.warning(`\nDeploying project with ${errors} errors\n`),
            );
        } else {
            console.error(
                styles.error(
                    `Can't deploy with errors. If you still want to deploy, add ${styles.bold(
                        '--ignore-errors',
                    )} flag`,
                ),
            );
            process.exit(1);
        }
    }

    await lightdashApi<undefined>({
        method: 'PUT',
        url: `/api/v1/projects/${options.projectUuid}/explores`,
        body: JSON.stringify(explores),
    });
    await LightdashAnalytics.track({
        event: 'deploy.triggered',
        properties: {
            projectId: options.projectUuid,
        },
    });
};

const getOrCreateNewProject = async (
    options: DeployHandlerOptions,
): Promise<Project | undefined> => {
    console.error('');
    const absoluteProjectPath = path.resolve(options.projectDir);
    const context = await getDbtContext({
        projectDir: absoluteProjectPath,
    });
    const dbtName = friendlyName(context.projectName);

    // Get the project name
    let projectName = dbtName;
    if (process.env.CI !== 'true') {
        if (options.name) {
            // If the name option is provided, use that.
            projectName = options.name;
        } else {
            // Otherwise, prompt the user for a name.
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: `Add a project name or press enter to use the default: [${dbtName}] `,
                },
            ]);
            projectName = answers.name ? answers.name : dbtName;
        }
    }
    // Return the existing project if it exists
    const existingProject = await getDefaultProject(projectName);
    if (existingProject) {
        console.info(`Project ${projectName} already exists.`);
        return existingProject;
    }

    // Create the project
    console.error('');
    const spinner = GlobalState.startSpinner(
        `  Creating new project ${styles.bold(projectName)}`,
    );
    await LightdashAnalytics.track({
        event: 'create.started',
        properties: {
            projectName,
            isDefaultName: dbtName === projectName,
        },
    });
    try {
        const project = await createProject({
            ...options,
            name: projectName,
            type: ProjectType.DEFAULT,
        });
        if (!project) {
            spinner.fail('Cancel preview environment');
            return undefined;
        }
        spinner.succeed(`  New project ${styles.bold(projectName)} created\n`);

        await LightdashAnalytics.track({
            event: 'create.completed',
            properties: {
                projectId: project.projectUuid,
                projectName,
            },
        });

        return project;
    } catch (e) {
        await LightdashAnalytics.track({
            event: 'create.error',
            properties: {
                error: `Error creating developer preview ${e}`,
            },
        });

        spinner.fail();
        throw e;
    }
};

export const deployHandler = async (options: DeployHandlerOptions) => {
    GlobalState.setVerbose(options.verbose);
    await checkLightdashVersion();
    const explores = await compile(options);

    const config = await getConfig();
    let projectUuid: string;

    if (options.create) {
        const project = await getOrCreateNewProject(options);
        if (!project) {
            console.error(
                "To preview your project, you'll need to manually enter your warehouse connection details.",
            );
            const createProjectUrl =
                config.context?.serverUrl &&
                new URL('/createProject', config.context.serverUrl);
            if (createProjectUrl) {
                console.error(
                    `Fill out the project connection form here: ${createProjectUrl}`,
                );
            }
            return;
        }
        projectUuid = project.projectUuid;
        await setProject(projectUuid, project.name);
    } else {
        if (!(config.context?.project && config.context.serverUrl)) {
            throw new AuthorizationError(
                `No active Lightdash project. Run 'lightdash login --help'`,
            );
        }
        projectUuid = config.context.project;
    }

    await deploy(explores, { ...options, projectUuid });

    const displayUrl = options.create
        ? `${config.context?.serverUrl}/createProject/cli?projectUuid=${projectUuid}`
        : `${config.context?.serverUrl}/projects/${projectUuid}/home`;

    console.error(`${styles.bold('Successfully deployed project:')}`);
    console.error('');
    console.error(`      ${styles.bold(`⚡️ ${displayUrl}`)}`);
    console.error('');
};
