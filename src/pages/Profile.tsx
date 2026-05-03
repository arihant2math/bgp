import { useQuery } from "@tanstack/solid-query";
import { Match, Switch } from "solid-js";
import OrganizationPageLayout from "../components/OrganizationPageLayout.tsx";
import UserPageLayout from "../components/UserPageLayout.tsx";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";

export type ProfileProps = {
    profile: string;
};

function Profile(props: ProfileProps) {
    const profileQuery = useQuery(() => ({
        queryKey: ["profile", props.profile],
        queryFn: () =>
            getOctokit()
                .rest.users.getByUsername({ username: props.profile })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <Switch>
            <Match when={profileQuery.isPending}>Loading ...</Match>
            <Match when={profileQuery.isError}>Error</Match>
            <Match when={profileQuery.isSuccess && profileQuery.data.type === "Organization"}>
                <OrganizationPageLayout profile={props.profile} active="overview" />
            </Match>
            <Match when={profileQuery.isSuccess}>
                <UserPageLayout profile={props.profile} active="overview" />
            </Match>
        </Switch>
    );
}

export default Profile;
