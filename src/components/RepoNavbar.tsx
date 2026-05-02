import type { Component, JSX } from "solid-js";

export type RepoTab = "code" | "issues" | "pulls";

type RepoNavbarItemProps = {
    href: string;
    label: string;
    active?: boolean;
    children: JSX.Element;
};

export const RepoNavbarItem: Component<RepoNavbarItemProps> = (props) => {
    return (
        <a
            href={props.href}
            aria-current={props.active ? "page" : undefined}
            class={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                props.active
                    ? "border-[#fd8c73] text-[#191510]"
                    : "border-transparent text-[#5c554b] hover:border-[#d8d0c2] hover:text-[#191510]"
            }`}
        >
            <span class="h-4 w-4" aria-hidden="true">
                {props.children}
            </span>
            {props.label}
        </a>
    );
};

type RepoNavbarProps = {
    profile: string;
    repo: string;
    active: RepoTab;
};

const iconClass = "h-4 w-4 stroke-current";

function repoHref(profile: string, repo: string, suffix = "") {
    const base = `/${encodeURIComponent(profile)}/${encodeURIComponent(repo)}`;
    return `${base}${suffix}`;
}

function tabClass(props: RepoNavbarProps, tab: string) {
    return `tab ${props.active === tab ? "tab-active" : ""}`;
}

const RepoNavbar: Component<RepoNavbarProps> = (props) => {
    return (
        <nav>
            <div role="tablist" class="tabs tabs-border">
                <a href={repoHref(props.profile, props.repo)} class={tabClass(props, "code")}>Code</a>
                <a href={repoHref(props.profile, props.repo, "/issues")} class={tabClass(props, "issues")}>Issues</a>
                <a href={repoHref(props.profile, props.repo, "/pulls")} class={tabClass(props, "pulls")}>Pull requests</a>
            </div>
        </nav>
    );
};

export default RepoNavbar;
