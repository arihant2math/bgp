import { TextInput } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { useLocation } from "@solidjs/router";
import { createMemo, For, Show, type Component } from "solid-js";
import { appHref, stripAppBase } from "../lib/baseUrl.ts";
import { profileHref, repoHref } from "../lib/hrefGen.ts";

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
        <nav class="border-b border-[var(--borderColor-default)] bg-[var(--bgColor-default)]">
            <div class="mx-auto flex min-h-14 max-w-6xl items-center gap-4 px-4">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                    <a href={appHref("/")} aria-label="Home">
                        <Octicon
                            name="mark-github"
                            size={32}
                            aria-hidden="true"
                        />
                    </a>
                    <div class="min-w-0 truncate text-sm text-[var(--fgColor-muted)]">
                        <For each={breadcrumbs()}>
                            {(breadcrumb, index) => (
                                <>
                                    <a
                                        href={breadcrumb.href}
                                        class="text-[var(--fgColor-default)] hover:text-[var(--fgColor-accent)] hover:underline"
                                    >
                                        {breadcrumb.label}
                                    </a>
                                    <Show
                                        when={
                                            index() < breadcrumbs().length - 1
                                        }
                                    >
                                        <span class="mx-2 text-[var(--fgColor-muted)]">
                                            /
                                        </span>
                                    </Show>
                                </>
                            )}
                        </For>
                    </div>
                </div>
                <TextInput
                    type="search"
                    placeholder="Search"
                    size="small"
                    leadingVisual={
                        <Octicon name="search" size={16} aria-hidden="true" />
                    }
                    class="w-24 md:w-64"
                />
            </div>
        </nav>
    );
};

export default MainNavbar;
