import {type Component, For} from "solid-js";
import {Dynamic} from "solid-js/web";

export type MainNavbarBreadcrumb = {
    link: Component;
    href: string;
}

export type MainNavbarProps = {
    breadcrumbs: MainNavbarBreadcrumb[];
};

const MainNavbar: Component<MainNavbarProps> = (props) => {
    return (
        <nav class="navbar bg-base-100 shadow-sm">
            <div class="flex-1">
                <a href="/">TODO Icon</a>
                <For each={props.breadcrumbs}>
                    {(breadcrumb) => (
                        <div>
                            <span class="mx-2">/</span>
                            <a href={breadcrumb.href}><Dynamic component={breadcrumb.link}/></a>
                        </div>
                    )}
                </For>
            </div>
            <div class="flex gap-2">
                <input type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto" />
            </div>
        </nav>
    );
};

export default MainNavbar;
