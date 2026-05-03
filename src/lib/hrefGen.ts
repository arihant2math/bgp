export function profileHref(profile: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}`;
    return `${base}${suffix}`;
}

export function repoHref(profile: string, repo: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}/${encodeURIComponent(repo)}`;
    return `${base}${suffix}`;
}

function encodedPath(path: string[] = []) {
    return path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : "";
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
        `/tree/${encodeURIComponent(tree)}/${path}`,
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
        `/commits/${encodeURIComponent(tree)}/${path}`,
    );
}
