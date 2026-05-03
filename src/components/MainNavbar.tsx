import { createMemo, type Component, For, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { Box, Breadcrumbs, Label, Link, TextInput } from "../vendor/primer-solid";
import { appHref, stripAppBase } from "../lib/baseUrl.ts";
import { profileHref, repoHref } from "../lib/hrefGen.ts";
import { repoNavbarState } from "../lib/navbarState.ts";
import Avatar from "./Avatar.tsx";
import Octicon from "./Octicon.tsx";

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
        <Box
            as="nav"
            sx={{
                display: "flex",
                "align-items": "center",
                gap: "1rem",
                padding: "1rem",
                border: "1px solid var(--borderColor-default)",
                "border-left": "0",
                "border-right": "0",
                "background-color": "var(--bgColor-default)",
            }}
        >
            <Link href={appHref("/") }>
                <Octicon name="mark-github" size={32} aria-hidden="true" />
            </Link>
            <Box sx={{ display: "flex", "align-items": "center", gap: "0.5rem", flex: 1 }}>
                <Show when={repoNavbarState()}>
                    {(repoState) => (
                        <Avatar
                            href={repoState().avatarUrl}
                            size={24}
                            alt={`${repoState().ownerLogin}'s avatar`}
                        />
                    )}
                </Show>
                <Show
                    when={repoNavbarState()}
                    fallback={
                        <Breadcrumbs>
                            <For each={breadcrumbs()}>
                                {(breadcrumb, index) => (
                                    <Breadcrumbs.Item
                                        href={breadcrumb.href}
                                        selected={index() === breadcrumbs().length - 1}
                                    >
                                        {breadcrumb.label}
                                    </Breadcrumbs.Item>
                                )}
                            </For>
                        </Breadcrumbs>
                    }
                >
                    {(repoState) => (
                        <Box sx={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                            <Breadcrumbs>
                                <Breadcrumbs.Item href={profileHref(repoState().ownerLogin)}>
                                    {repoState().ownerLogin}
                                </Breadcrumbs.Item>
                                <Breadcrumbs.Item
                                    href={repoHref(repoState().ownerLogin, repoState().repoName)}
                                    selected
                                >
                                    {repoState().repoName}
                                </Breadcrumbs.Item>
                            </Breadcrumbs>
                            <Label>{repoState().visibility}</Label>
                        </Box>
                    )}
                </Show>
            </Box>
            <TextInput
                placeholder="Search"
                size="medium"
                block={false}
                sx={{ width: "16rem" }}
            />
        </Box>
    );
};

export default MainNavbar;
