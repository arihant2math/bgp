import { Button, Heading, Stack, Text } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { type JSX, Show } from "solid-js";
import Avatar from "./Avatar.tsx";
import UserNavbar from "./UserNavbar.tsx";
import type { UserTab } from "./UserNavbar.tsx";

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
                    <Stack gap="condensed">
                        <Avatar
                            href={props.profileData.data.avatar_url}
                            size={296}
                            alt={`${props.profile}'s avatar`}
                        />
                        <Heading as="h1" size="large">
                            {props.profileData.data.name}
                        </Heading>
                        <Text
                            as="p"
                            size="large"
                            style={{ color: "var(--fgColor-muted)" }}
                        >
                            {props.profileData.data.login}
                        </Text>
                        <Button block>Follow</Button>
                        <Show when={props.profileData.data.bio}>
                            <Text as="p">{props.profileData.data.bio}</Text>
                        </Show>
                        <Show when={props.profileData.data.location !== null}>
                            <div class="flex items-center flex-row gap-2">
                                <Octicon
                                    name="location"
                                    size={16}
                                    aria-hidden="true"
                                />
                                <Text as="span" size="small">
                                    {props.profileData.data.location}
                                </Text>
                            </div>
                        </Show>
                        {/*<p>{JSON.stringify(props.profileData.data)}</p>*/}
                    </Stack>
                </aside>
                <div class="flex-1">{props.children}</div>
            </div>
        </main>
    );
}

export default UserPageLayout;
