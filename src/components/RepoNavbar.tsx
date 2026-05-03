import type { Component } from "solid-js";
import { Box, Link } from "../vendor/primer-solid";
import Octicon from "./Octicon.tsx";
import { repoHref } from "../lib/hrefGen.ts";

export type RepoTab = "code" | "issues" | "pulls";

type RepoNavbarProps = {
    profile: string;
    repo: string;
    active: RepoTab;
};

function tabSx(active: boolean) {
    return {
        display: "inline-flex",
        "align-items": "center",
        gap: "0.5rem",
        padding: "0.75rem 0",
        "font-weight": active ? "600" : "500",
        color: active ? "#0969da" : "var(--fgColor-muted)",
        "text-decoration": "none",
        "border-bottom": active
            ? "2px solid #0969da"
            : "2px solid transparent",
    } as const;
}

const RepoNavbar: Component<RepoNavbarProps> = (props) => {
    return (
        <Box
            as="nav"
            sx={{
                display: "flex",
                gap: "2rem",
                "border-bottom": "1px solid var(--borderColor-default)",
                "margin-bottom": "1.5rem",
            }}
        >
            <Link href={repoHref(props.profile, props.repo)} sx={tabSx(props.active === "code")}>
                <Octicon name="code" size={16} aria-hidden="true" />
                Code
            </Link>
            <Link
                href={repoHref(props.profile, props.repo, "/issues")}
                sx={tabSx(props.active === "issues")}
            >
                <Octicon name="issue-opened" size={16} aria-hidden="true" />
                Issues
            </Link>
            <Link
                href={repoHref(props.profile, props.repo, "/pulls")}
                sx={tabSx(props.active === "pulls")}
            >
                <Octicon name="git-pull-request" size={16} aria-hidden="true" />
                Pull Requests
            </Link>
            <Link
                href={repoHref(props.profile, props.repo, "/discussions")}
                sx={tabSx(false)}
            >
                <Octicon name="comment-discussion" size={16} aria-hidden="true" />
                Discussions
            </Link>
            <Link href={repoHref(props.profile, props.repo, "/actions")} sx={tabSx(false)}>
                <Octicon name="play" size={16} aria-hidden="true" />
                Actions
            </Link>
        </Box>
    );
};

export default RepoNavbar;
