import { UnderlineNav } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import type { Component } from "solid-js";
import { profileHref } from "../lib/hrefGen.ts";

export type UserTab = "overview" | "repositories" | "stars";

type UserNavbarProps = {
    profile: string;
    active: UserTab;
};

const UserNavbar: Component<UserNavbarProps> = (props) => {
    return (
        <UnderlineNav
            aria-label="User"
            variant="flush"
            class="px-4"
        >
            <UnderlineNav.Item
                href={profileHref(props.profile)}
                aria-current={props.active === "overview" ? "page" : undefined}
                leadingVisual={<Octicon name="book" size={16} aria-hidden="true" />}
            >
                Overview
            </UnderlineNav.Item>
            <UnderlineNav.Item
                href={profileHref(props.profile, "?tab=repositories")}
                aria-current={
                    props.active === "repositories" ? "page" : undefined
                }
                leadingVisual={<Octicon name="repo" size={16} aria-hidden="true" />}
            >
                Repositories
            </UnderlineNav.Item>
            <UnderlineNav.Item
                href={profileHref(props.profile, "?tab=stars")}
                aria-current={props.active === "stars" ? "page" : undefined}
                leadingVisual={<Octicon name="star" size={16} aria-hidden="true" />}
            >
                Stars
            </UnderlineNav.Item>
        </UnderlineNav>
    );
};

export default UserNavbar;
