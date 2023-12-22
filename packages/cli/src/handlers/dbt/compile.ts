import { ParseError } from '@lightdash/common';
import execa from 'execa';
import GlobalState from '../../globalState';

export type DbtCompileOptions = {
    profilesDir: string;
    projectDir: string;
    target: string | undefined;
    profile: string | undefined;
    select: string[] | undefined;
    models: string[] | undefined;
    vars: string | undefined;
    threads: string | undefined;
    noVersionCheck: boolean | undefined;
    exclude: string[] | undefined;
    selector: string | undefined;
    state: string | undefined;
    fullRefresh: boolean | undefined;
    skipDbtCompile: boolean | undefined;
    skipWarehouseCatalog: boolean | undefined;
};

const dbtCompileArgs = [
    'profilesDir',
    'projectDir',
    'target',
    'profile',
    'select',
    'models',
    'vars',
    'threads',
    'noVersionCheck',
    'exclude',
    'selector',
    'state',
    'fullRefresh',
];

const camelToSnakeCase = (str: string) =>
    str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const optionsToArgs = (options: DbtCompileOptions): string[] =>
    Object.entries(options).reduce<string[]>((acc, [key, value]) => {
        if (value !== undefined && dbtCompileArgs.includes(key)) {
            const argKey = `--${camelToSnakeCase(key)}`;
            if (typeof value !== 'boolean') {
                return [
                    ...acc,
                    argKey,
                    Array.isArray(value) ? value.join(' ') : value,
                ];
            }
            return [...acc, argKey];
        }
        return acc;
    }, []);
export const dbtCompile = async (
    options: DbtCompileOptions,
): Promise<string[]> => {
    try {
        const args = [
            ...optionsToArgs(options),
            '--quiet',
            '--output',
            'json',
            '--output-keys',
            'unique_id',
        ];
        GlobalState.debug(`> Running: dbt ls ${args.join(' ')}`);
        const { stdout, stderr } = await execa('dbt', ['ls', ...args]);
        const models = stdout
            .split('\n')
            .slice(1)
            .map((line) => JSON.parse(line).unique_id);
        console.error(models);
        console.error(stderr);
        return models;
    } catch (e: any) {
        throw new ParseError(`Failed to run dbt compile:\n  ${e.message}`);
    }
};
