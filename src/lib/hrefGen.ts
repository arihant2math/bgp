export function profileHref(profile: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}`;
    return `${base}${suffix}`;
}

export function repoHref(profile: string, repo: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}/${encodeURIComponent(repo)}`;
    return `${base}${suffix}`;
}
