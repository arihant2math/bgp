import type { Component } from "solid-js";
import { Box, Link } from "../vendor/primer-solid";
import Octicon from "./Octicon.tsx";
import { profileHref } from "../lib/hrefGen.ts";

export type UserTab = "overview" | "repositories" | "stars";

type UserNavbarProps = {
    profile: string;
    active: UserTab;
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

const UserNavbar: Component<UserNavbarProps> = (props) => {
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
            <Link href={profileHref(props.profile)} sx={tabSx(props.active === "overview")}>
                <Octicon name="book" size={16} aria-hidden="true" />
                Overview
            </Link>
            <Link
                href={profileHref(props.profile, "?tab=repositories")}
                sx={tabSx(props.active === "repositories")}
            >
                <Octicon name="repo" size={16} aria-hidden="true" />
                Repositories
            </Link>
            <Link
                href={profileHref(props.profile, "?tab=stars")}
                sx={tabSx(props.active === "stars")}
            >
                <Octicon name="star" size={16} aria-hidden="true" />
                Stars
            </Link>
        </Box>
    );
};

export default UserNavbar;
