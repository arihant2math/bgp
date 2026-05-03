import { createMemo, type Component, For, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { appHref, stripAppBase } from "../lib/baseUrl.ts";
import { profileHref, repoHref } from "../lib/hrefGen.ts";
import { Octicon } from "@primer/solid/octicon";

export type MainNavbarBreadcrumb = {
    label: string;
    href: string;
};

export type MainNavbarProps = {
    breadcrumbs?: MainNavbarBreadcrumb[];
};

const ROOT_ROUTES = new Set(["login", "notifications"]);

function safeDecodeUriComponent(value: string) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

const MainNavbar: Component<MainNavbarProps> = (props) => {
    const location = useLocation();
    const breadcrumbs = createMemo(() => {
        if (props.breadcrumbs) {
            return props.breadcrumbs;
        }

        const [profileSegment, repoSegment] = stripAppBase(location.pathname)
            .split("/")
            .filter(Boolean);

        if (!profileSegment || ROOT_ROUTES.has(profileSegment)) {
            return [];
        }

        const profile = safeDecodeUriComponent(profileSegment);

        if (!repoSegment) {
            return [{ label: profile, href: profileHref(profile) }];
        }

        const repo = safeDecodeUriComponent(repoSegment);
        return [
            { label: profile, href: profileHref(profile) },
            { label: repo, href: repoHref(profile, repo) },
        ];
    });

    return (
        <nav class="navbar bg-base-100 shadow-sm">
            <div class="flex-1 flex items-center gap-2">
                <a href={appHref("/")}>
                    <Octicon name="mark-github" size={32} aria-hidden="true" />
                </a>
                <div>
                    <For each={breadcrumbs()}>
                        {(breadcrumb, index) => (
                            <>
                                <a href={breadcrumb.href}>{breadcrumb.label}</a>
                                <Show when={index() < breadcrumbs().length - 1}>
                                    <span class="mx-2 text-base-content/50">
                                        /
                                    </span>
                                </Show>
                            </>
                        )}
                    </For>
                </div>
            </div>
            <div class="flex gap-2">
                <input
                    type="text"
                    placeholder="Search"
                    class="input input-bordered w-24 md:w-auto"
                />
            </div>
        </nav>
    );
};

export default MainNavbar;
