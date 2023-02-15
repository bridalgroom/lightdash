import { ParseError } from '@lightdash/common';
import execa from 'execa';

export const getDbtVersion = async () => {
    try {
        const { stderr } = await execa('dbt', ['--version']);
        const coreVersionRegex = /installed:.*/;
        const version = await stderr.match(coreVersionRegex);
        if (version === null || version.length === 0)
            throw new ParseError(`Can't locate dbt --version: ${stderr}`);
        return version[0].split(':')[1].trim();
    } catch (e: any) {
        throw new ParseError(`Failed to get dbt --version:\n  ${e.message}`);
    }
};

export const isSupportedDbtVersion = (version: string) => {
    if (version.startsWith('1.3.')) return true;
    if (version === '1.4.0') return true;
    if (version === '1.4.1') return true;
    return false;
};
