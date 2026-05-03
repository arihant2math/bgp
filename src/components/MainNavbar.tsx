import type { Component } from "solid-js";
import type {OrganizationTab} from "./OrganizationNavbar.tsx";

type MainNavbarProps = {
    link: string;
    href: string;
};

const MainNavbar: Component<MainNavbarProps> = (props) => {
    return (
        <nav class="navbar bg-base-100 shadow-sm">
            <div class="flex-1">
                <a href={props.href}>{props.link}</a>
            </div>
            <div class="flex gap-2">
                <input type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto" />
            </div>
        </nav>
    );
};

export default MainNavbar;
