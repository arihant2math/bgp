import type { JSX } from "solid-js";
import OrganizationNavbar from "./OrganizationNavbar.tsx";
import type { OrganizationTab } from "./OrganizationNavbar.tsx";

export type OrganizationPageLayoutProps = {
    profile: string;
    active: OrganizationTab;
    children?: JSX.Element;
};

function OrganizationPageLayout(props: OrganizationPageLayoutProps) {
    return (
        <main>
            <OrganizationNavbar profile={props.profile} active={props.active} />
            <div class="flex flex-col mx-8">{props.children}</div>
        </main>
    );
}

export default OrganizationPageLayout;
