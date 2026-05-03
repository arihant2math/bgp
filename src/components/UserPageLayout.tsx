import { type JSX, Show } from "solid-js";
import { Button } from "../vendor/primer-solid";
import Avatar from "./Avatar.tsx";
import UserNavbar from "./UserNavbar.tsx";
import type { UserTab } from "./UserNavbar.tsx";
import Octicon from "./Octicon.tsx";

export type UserPageLayoutProps = {
    profile: string;
    profileData: any;
    active: UserTab;
    children?: JSX.Element;
};

function UserPageLayout(props: UserPageLayoutProps) {
    return (
        <main>
            <UserNavbar profile={props.profile} active={props.active} />
            <div class="flex gap-8 max-w-6xl mx-auto mt-8">
                <aside class="w-72 shrink-0">
                    <div class="flex flex-col gap-2">
                        <Avatar
                            href={props.profileData.data.avatar_url}
                            size={296}
                            alt={`${props.profile}'s avatar`}
                            class="border border-base-300 bg-base-200"
                        />
                        <h1 class="text-2xl">{props.profileData.data.name}</h1>
                        <p class="text-lg">{props.profileData.data.login}</p>
                        <Button class="w-full">Follow</Button>
                        <p>{props.profileData.data.bio}</p>
                        <Show when={props.profileData.data.location !== null}>
                            <div class="flex items-center flex-row gap-2">
                                <Octicon
                                    name="location"
                                    size={16}
                                    aria-hidden="true"
                                />{" "}
                                {props.profileData.data.location}
                            </div>
                        </Show>
                        {/*<p>{JSON.stringify(props.profileData.data)}</p>*/}
                    </div>
                </aside>
                <div class="flex-1">{props.children}</div>
            </div>
        </main>
    );
}

export default UserPageLayout;
