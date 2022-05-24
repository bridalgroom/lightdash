import { ParseError } from '@lightdash/common';
import { promises as fs } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

type GetDbtContextArgs = {
    projectDir: string;
    initialProjectDir?: string;
};
export type DbtContext = {
    projectName: string;
    profileName: string;
    targetDir: string;
    modelsDir: string;
};

export const getDbtContext = async ({
    projectDir,
    initialProjectDir,
}: GetDbtContextArgs): Promise<DbtContext> => {
    const projectFilename = path.join(projectDir, 'dbt_project.yml');
    let config;

    try {
        config = yaml.load(
            await fs.readFile(projectFilename, { encoding: 'utf-8' }),
        ) as any;
    } catch (e: any) {
        if (projectDir !== '/') {
            const parentDir = path.join(projectDir, '..');
            console.log(
                `File dbt_project.yml does not exist on ${projectDir}, trying with parent dir ${parentDir}`,
            );
            return await getDbtContext({
                projectDir: parentDir,
                initialProjectDir: initialProjectDir || projectDir,
            });
        }
        const initialProjectFilename = path.join(
            initialProjectDir || projectDir,
            'dbt_project.yml',
        );

        throw new ParseError(
            `Is ${projectDir} a valid dbt project? Couldn't find a valid dbt_project.yml file at ${initialProjectFilename}:\n  ${e.message}`,
        );
    }
    const targetSubDir = config['target-path'] || './target';
    const targetDir = path.join(projectDir, targetSubDir);
    const modelsSubDir = config['models-path'] || './models';
    const modelsDir = path.join(projectDir, modelsSubDir);
    return {
        projectName: config.name as string,
        profileName: config.profile as string,
        targetDir,
        modelsDir,
    };
};
