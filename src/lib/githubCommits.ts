import { getOctokit } from "./octokit.ts";

export type CommitAuthor = {
    name: string;
    login?: string;
    email?: string;
    avatarUrl?: string;
    url?: string;
};

export type CommitSummary = {
    oid: string;
    abbreviatedOid: string;
    message: string;
    committedDate: string;
    commitUrl?: string;
    authors: CommitAuthor[];
    authorTotalCount: number;
};

export type DirectoryCommitMetadata = {
    latestCommit: CommitSummary | null;
    totalCount: number;
    itemCommitsByPath: Record<string, CommitSummary | null>;
};

type GraphQLUser = {
    login?: string | null;
    avatarUrl?: string | null;
    url?: string | null;
};

type GraphQLAuthor = {
    name?: string | null;
    email?: string | null;
    user?: GraphQLUser | null;
};

type GraphQLAuthorsConnection = {
    totalCount?: number | null;
    nodes?: Array<GraphQLAuthor | null> | null;
};

type GraphQLCommit = {
    oid: string;
    abbreviatedOid: string;
    messageHeadline?: string | null;
    committedDate: string;
    commitUrl?: string | null;
    authors?: GraphQLAuthorsConnection | null;
    author?: GraphQLAuthor | null;
};

type GraphQLHistoryConnection = {
    totalCount?: number | null;
    nodes?: Array<GraphQLCommit | null> | null;
};

type GraphQLCommitTarget = {
    latest?: GraphQLHistoryConnection | null;
    [alias: `item${number}`]: GraphQLHistoryConnection | null | undefined;
};

type DirectoryCommitMetadataGraphQLResponse = {
    repository?: {
        object?: GraphQLCommitTarget | null;
    } | null;
};

function historySelection(alias: string, path?: string | null) {
    const pathArg = path ? `, path: ${JSON.stringify(path)}` : "";
    return `${alias}: history(first: 1${pathArg}) {
        totalCount
        nodes {
            ...CommitFields
        }
    }`;
}

function normalizeAuthor(author: GraphQLAuthor): CommitAuthor {
    const name =
        author.user?.login ?? author.name ?? author.email ?? "Unknown author";

    return {
        name,
        login: author.user?.login ?? undefined,
        email: author.email ?? undefined,
        avatarUrl: author.user?.avatarUrl ?? undefined,
        url: author.user?.url ?? undefined,
    };
}

function authorKey(author: CommitAuthor) {
    return author.login ?? author.email ?? author.name;
}

function normalizeAuthors(commit: GraphQLCommit) {
    const authors = (commit.authors?.nodes ?? [])
        .filter((author): author is GraphQLAuthor => author !== null)
        .map(normalizeAuthor);

    if (authors.length === 0 && commit.author) {
        authors.push(normalizeAuthor(commit.author));
    }

    const dedupedAuthors = authors.filter(
        (author, index, list) =>
            list.findIndex((item) => authorKey(item) === authorKey(author)) ===
            index,
    );

    return {
        authors: dedupedAuthors,
        authorTotalCount: Math.max(
            commit.authors?.totalCount ?? 0,
            dedupedAuthors.length,
        ),
    };
}

function normalizeCommit(commit?: GraphQLCommit | null): CommitSummary | null {
    if (!commit) return null;

    const authors = normalizeAuthors(commit);

    return {
        oid: commit.oid,
        abbreviatedOid: commit.abbreviatedOid,
        message: commit.messageHeadline?.trim() || "No commit message",
        committedDate: commit.committedDate,
        commitUrl: commit.commitUrl ?? undefined,
        ...authors,
    };
}

function firstCommit(connection?: GraphQLHistoryConnection | null) {
    return normalizeCommit(
        connection?.nodes?.find((commit) => commit !== null),
    );
}

export async function fetchDirectoryCommitMetadata(params: {
    owner: string;
    repo: string;
    ref: string;
    path?: string | null;
    itemPaths: string[];
}): Promise<DirectoryCommitMetadata> {
    const itemPaths = [
        ...new Set(params.itemPaths.filter((path) => path.length > 0)),
    ];
    const itemSelections = itemPaths
        .map((path, index) => historySelection(`item${index}`, path))
        .join("\n");

    const query = `
        query DirectoryCommitMetadata($owner: String!, $name: String!, $expression: String!) {
            repository(owner: $owner, name: $name) {
                object(expression: $expression) {
                    ... on Commit {
                        ${historySelection("latest", params.path)}
                        ${itemSelections}
                    }
                }
            }
        }

        fragment CommitFields on Commit {
            oid
            abbreviatedOid
            messageHeadline
            committedDate
            commitUrl
            authors(first: 6) {
                totalCount
                nodes {
                    name
                    email
                    user {
                        login
                        avatarUrl
                        url
                    }
                }
            }
            author {
                name
                email
                user {
                    login
                    avatarUrl
                    url
                }
            }
        }
    `;

    const response = (await getOctokit().graphql(query, {
        owner: params.owner,
        name: params.repo,
        expression: params.ref,
    })) as DirectoryCommitMetadataGraphQLResponse;

    const target = response.repository?.object;
    const itemCommitsByPath: Record<string, CommitSummary | null> = {};

    itemPaths.forEach((path, index) => {
        itemCommitsByPath[path] = firstCommit(target?.[`item${index}`]);
    });

    return {
        latestCommit: firstCommit(target?.latest),
        totalCount: target?.latest?.totalCount ?? 0,
        itemCommitsByPath,
    };
}
