import type { Component } from "solid-js";
import Octicon from "./Octicon.tsx";
import { repoHref } from "../lib/hrefGen.ts";

export type RepoTab = "code" | "issues" | "pulls";

type RepoNavbarProps = {
    profile: string;
    repo: string;
    active: RepoTab;
};

function tabClass(props: RepoNavbarProps, tab: string) {
    return `tab ${props.active === tab ? "tab-active" : ""} gap-2`;
}

const RepoNavbar: Component<RepoNavbarProps> = (props) => {
    return (
        <nav>
            <div role="tablist" class="tabs tabs-border">
                <a
                    href={repoHref(props.profile, props.repo)}
                    class={tabClass(props, "code")}
                >
                    <Octicon name="code" size={16} aria-hidden="true" />
                    Code
                </a>
                <a
                    href={repoHref(props.profile, props.repo, "/issues")}
                    class={tabClass(props, "issues")}
                >
                    <Octicon name="issue-opened" size={16} aria-hidden="true" />
                    Issues
                </a>
                <a
                    href={repoHref(props.profile, props.repo, "/pulls")}
                    class={tabClass(props, "pulls")}
                >
                    <Octicon
                        name="git-pull-request"
                        size={16}
                        aria-hidden="true"
                    />
                    Pull Requests
                </a>
                <a
                    href={repoHref(props.profile, props.repo, "/discussions")}
                    class={tabClass(props, "discussions")}
                >
                    <Octicon
                        name="comment-discussion"
                        size={16}
                        aria-hidden="true"
                    />
                    Discussions
                </a>
                <a
                    href={repoHref(props.profile, props.repo, "/actions")}
                    class={tabClass(props, "actions")}
                >
                    <Octicon name="play" size={16} aria-hidden="true" />
                    Actions
                </a>
            </div>
        </nav>
    );
};

export default RepoNavbar;
