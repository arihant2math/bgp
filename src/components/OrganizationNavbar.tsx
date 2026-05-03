import type { Component } from "solid-js";
import Octicon from "./Octicon.tsx";
import { profileHref } from "../lib/hrefGen.ts";

export type OrganizationTab = "overview" | "repositories" | "teams" | "people";

type OrganizationNavbarProps = {
    profile: string;
    active: OrganizationTab;
};

function tabClass(props: OrganizationNavbarProps, tab: string) {
    return `tab ${props.active === tab ? "tab-active" : ""} gap-2`;
}

const OrganizationNavbar: Component<OrganizationNavbarProps> = (props) => {
    return (
        <nav>
            <div role="tablist" class="tabs tabs-border">
                <a
                    href={profileHref(props.profile)}
                    class={tabClass(props, "overview")}
                >
                    <Octicon name="book" size={16} aria-hidden="true" />
                    Overview
                </a>
                <a href="#" class={tabClass(props, "repositories")}>
                    <Octicon name="repo" size={16} aria-hidden="true" />
                    Repositories
                </a>
            </div>
        </nav>
    );
};

export default OrganizationNavbar;
