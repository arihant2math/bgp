import type { JSX } from "solid-js";
import UserNavbar from "./UserNavbar.tsx";
import type { UserTab } from "./UserNavbar.tsx";

export type UserPageLayoutProps = {
    profile: string;
    active: UserTab;
    children?: JSX.Element;
};

function UserPageLayout(props: UserPageLayoutProps) {
    return (
        <main>
            <UserNavbar profile={props.profile} active={props.active} />
            <div class="flex flex-col mx-8">{props.children}</div>
        </main>
    );
}

export default UserPageLayout;
