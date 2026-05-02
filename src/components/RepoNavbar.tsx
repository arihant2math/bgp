import type { Component, JSX } from "solid-js";
import Octicon from "./Octicon.tsx";

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
    return `tab ${props.active === tab ? "tab-active" : ""} gap-2`;
}

const RepoNavbar: Component<RepoNavbarProps> = (props) => {
    return (
        <nav>
            <div role="tablist" class="tabs tabs-border">
                <a href={repoHref(props.profile, props.repo)} class={tabClass(props, "code")}>
                    <Octicon name="code" size={16} aria-hidden="true" />
                    Code
                </a>
                <a href={repoHref(props.profile, props.repo, "/issues")} class={tabClass(props, "issues")}>
                    <Octicon name="issue-opened" size={16} aria-hidden="true" />
                    Issues
                </a>
                <a href={repoHref(props.profile, props.repo, "/pulls")} class={tabClass(props, "pulls")}>
                    <Octicon name="git-pull-request" size={16} aria-hidden="true" />
                    Pull Requests
                </a>
                <a href={repoHref(props.profile, props.repo, "/discussions")} class={tabClass(props, "discussions")}>
                    <Octicon name="comment-discussion" size={16} aria-hidden="true" />
                    Discussions
                </a>
                <a href={repoHref(props.profile, props.repo, "/actions")} class={tabClass(props, "actions")}>
                    <Octicon name="play" size={16} aria-hidden="true" />
                    Actions
                </a>
            </div>
        </nav>
    );
};

export default RepoNavbar;
