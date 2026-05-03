import { UnderlineNav } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import type { Component } from "solid-js";
import { repoHref } from "../lib/hrefGen.ts";

export type RepoTab = "code" | "issues" | "pulls" | "discussions" | "actions";

type RepoNavbarProps = {
    profile: string;
    repo: string;
    active: RepoTab;
};

const RepoNavbar: Component<RepoNavbarProps> = (props) => {
    return (
        <UnderlineNav
            aria-label="Repository"
            variant="flush"
            class="px-4"
        >
            <UnderlineNav.Item
                href={repoHref(props.profile, props.repo)}
                aria-current={props.active === "code" ? "page" : undefined}
                leadingVisual={<Octicon name="code" size={16} aria-hidden="true" />}
            >
                Code
            </UnderlineNav.Item>
            <UnderlineNav.Item
                href={repoHref(props.profile, props.repo, "/issues")}
                aria-current={props.active === "issues" ? "page" : undefined}
                leadingVisual={<Octicon name="issue-opened" size={16} aria-hidden="true" />}
            >
                Issues
            </UnderlineNav.Item>
            <UnderlineNav.Item
                href={repoHref(props.profile, props.repo, "/pulls")}
                aria-current={props.active === "pulls" ? "page" : undefined}
                leadingVisual={
                    <Octicon name="git-pull-request" size={16} aria-hidden="true" />
                }
            >
                Pull Requests
            </UnderlineNav.Item>
            <UnderlineNav.Item
                href={repoHref(props.profile, props.repo, "/discussions")}
                aria-current={props.active === "discussions" ? "page" : undefined}
                leadingVisual={
                    <Octicon name="comment-discussion" size={16} aria-hidden="true" />
                }
            >
                Discussions
            </UnderlineNav.Item>
            <UnderlineNav.Item
                href={repoHref(props.profile, props.repo, "/actions")}
                aria-current={props.active === "actions" ? "page" : undefined}
                leadingVisual={<Octicon name="play" size={16} aria-hidden="true" />}
            >
                Actions
            </UnderlineNav.Item>
        </UnderlineNav>
    );
};

export default RepoNavbar;
