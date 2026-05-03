const rawBaseUrl = import.meta.env.BASE_URL || "/";

export const appBasePath =
    rawBaseUrl === "/" ? "" : rawBaseUrl.replace(/\/$/, "");

export function appHref(path = "/") {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (!appBasePath) {
        return normalizedPath;
    }

    return normalizedPath === "/"
        ? `${appBasePath}/`
        : `${appBasePath}${normalizedPath}`;
}

export function stripAppBase(pathname: string) {
    if (
        appBasePath &&
        (pathname === appBasePath || pathname.startsWith(`${appBasePath}/`))
    ) {
        return pathname.slice(appBasePath.length) || "/";
    }

    return pathname;
}
