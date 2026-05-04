import { getOctokit } from "./octokit.ts";

export type RepositoryBranch = {
    name: string;
    protected: boolean;
};

export type RepositoryTag = {
    name: string;
};

export type RepositoryRefs = {
    branches: RepositoryBranch[];
    tags: RepositoryTag[];
};

export async function fetchRepositoryRefs(params: {
    owner: string;
    repo: string;
}): Promise<RepositoryRefs> {
    const octokit = getOctokit();

    const [branches, tags] = await Promise.all([
        octokit.paginate(octokit.rest.repos.listBranches, {
            owner: params.owner,
            repo: params.repo,
            per_page: 100,
        }),
        octokit.paginate(octokit.rest.repos.listTags, {
            owner: params.owner,
            repo: params.repo,
            per_page: 100,
        }),
    ]);

    return {
        branches: branches
            .map((branch) => ({
                name: branch.name,
                protected: branch.protected,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        tags: tags
            .map((tag) => ({
                name: tag.name,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
    };
}
