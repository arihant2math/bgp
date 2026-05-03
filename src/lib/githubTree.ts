import { getOctokit, parseRestOctokitResponse } from "./octokit.ts";

export type RepoTreeEntry = {
    path: string;
    type: "dir" | "file";
};

function normalizePrefix(prefix?: string[]) {
    if (!prefix || prefix.length === 0) return "";
    return prefix.join("/").replace(/^\/+|\/+$/g, "");
}

export async function fetchRepositoryTreeEntries(params: {
    owner: string;
    repo: string;
    ref: string;
    prefix?: string[];
}) {
    const response = await getOctokit().rest.git.getTree({
        owner: params.owner,
        repo: params.repo,
        tree_sha: params.ref,
        recursive: "1",
    });
    const data = parseRestOctokitResponse(response);
    const prefix = normalizePrefix(params.prefix);
    const prefixWithSlash = prefix ? `${prefix}/` : "";

    return (Array.isArray(data.tree) ? data.tree : [])
        .filter((entry): entry is { path: string; type: string } =>
            typeof entry?.path === "string" && typeof entry?.type === "string",
        )
        .filter((entry) => entry.type === "blob" || entry.type === "tree")
        .filter((entry) => {
            if (!prefixWithSlash) return true;
            return entry.path.startsWith(prefixWithSlash);
        })
        .map((entry) => ({
            path: prefixWithSlash
                ? entry.path.slice(prefixWithSlash.length)
                : entry.path,
            type: entry.type === "tree" ? "dir" : "file",
        }))
        .filter((entry) => entry.path.length > 0) as RepoTreeEntry[];
}
