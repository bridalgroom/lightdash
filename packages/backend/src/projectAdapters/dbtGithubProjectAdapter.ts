import { DbtGitProjectAdapter } from './dbtGitProjectAdapter';

export class DbtGithubProjectAdapter extends DbtGitProjectAdapter {
    constructor(
        githubPersonalAccessToken: string,
        githubRepository: string,
        githubBranch: string,
        projectDirectorySubPath: string,
        profilesDirectorySubPath: string,
        port: number,
        target: string | undefined,
    ) {
        const remoteRepositoryUrl = `https://${githubPersonalAccessToken}@github.com/${githubRepository}.git`;
        super(
            remoteRepositoryUrl,
            githubBranch,
            projectDirectorySubPath,
            profilesDirectorySubPath,
            port,
            target,
        );
    }
}
