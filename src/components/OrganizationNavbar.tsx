import { UnderlineNav } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import type { Component } from "solid-js";
import { profileHref } from "../lib/hrefGen.ts";

export type OrganizationTab = "overview" | "repositories" | "teams" | "people";

type OrganizationNavbarProps = {
    profile: string;
    active: OrganizationTab;
};

const OrganizationNavbar: Component<OrganizationNavbarProps> = (props) => {
    return (
        <UnderlineNav
            aria-label="Organization"
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
        </UnderlineNav>
    );
};

export default OrganizationNavbar;
