import { appHref } from "./baseUrl.ts";

function pathSuffix(path: string[]) {
    const encodedPath = path.map(encodeURIComponent).join("/");
    return encodedPath ? `/${encodedPath}` : "";
}

export function profileHref(profile: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}`;
    return appHref(`${base}${suffix}`);
}

export function repoHref(profile: string, repo: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}/${encodeURIComponent(repo)}`;
    return appHref(`${base}${suffix}`);
}

export function repoTreeHref(
    profile: string,
    repo: string,
    tree: string,
    path: string[] = [],
) {
    return repoHref(
        profile,
        repo,
        `/tree/${encodeURIComponent(tree)}${pathSuffix(path)}`,
    );
}

export function repoCommitsHref(
    profile: string,
    repo: string,
    tree: string,
    path: string[] = [],
) {
    return repoHref(
        profile,
        repo,
        `/commits/${encodeURIComponent(tree)}${pathSuffix(path)}`,
    );
}
