import type { Component } from "solid-js";
import Octicon from "./Octicon.tsx";
import {profileHref} from "../lib/hrefGen.ts";

export type UserTab = "overview" | "repositories" | "stars";

type UserNavbarProps = {
    profile: string;
    active: UserTab;
};

function tabClass(props: UserNavbarProps, tab: string) {
    return `tab ${props.active === tab ? "tab-active" : ""} gap-2`;
}

const UserNavbar: Component<UserNavbarProps> = (props) => {
    return (
        <nav>
            <div role="tablist" class="tabs tabs-border">
                <a href={profileHref(props.profile)} class={tabClass(props, "overview")}>
                    <Octicon name="book" size={16} aria-hidden="true" />
                    Overview
                </a>
                <a href={profileHref(props.profile, "?tab=repositories")} class={tabClass(props, "repositories")}>
                    <Octicon name="repo" size={16} aria-hidden="true" />
                    Repositories
                </a>
                <a href={profileHref(props.profile, "?tab=stars")} class={tabClass(props, "stars")}>
                    <Octicon name="star" size={16} aria-hidden="true" />
                    Stars
                </a>
            </div>
        </nav>
    );
};

export default UserNavbar;
