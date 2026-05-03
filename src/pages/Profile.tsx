import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch } from "solid-js";
import OrganizationPageLayout from "../components/OrganizationPageLayout.tsx";
import UserPageLayout from "../components/UserPageLayout.tsx";
import RepoCard from "../components/RepoCard.tsx";
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

    const repositoriesQuery = useQuery(() => ({
        queryKey: ["profileRepositories", props.profile],
        queryFn: () =>
            getOctokit()
                .rest.repos.listForUser({
                    username: props.profile,
                    sort: "updated",
                    per_page: 6,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    const repositoryCards = () => (
        <section>
            <h2 class="mb-3 font-semibold">Repositories</h2>
            <Switch>
                <Match when={repositoriesQuery.isPending}>
                    Loading repositories...
                </Match>
                <Match when={repositoriesQuery.isError}>
                    Error loading repositories
                </Match>
                <Match when={repositoriesQuery.isSuccess}>
                    <div class="grid gap-4 md:grid-cols-2">
                        <For each={repositoriesQuery.data}>
                            {(repo) => (
                                <RepoCard
                                    owner={repo.owner.login}
                                    name={repo.name}
                                    description={repo.description}
                                    visibility={repo.visibility}
                                    language={repo.language}
                                    stars={repo.stargazers_count}
                                    forks={repo.forks_count}
                                    isFork={repo.fork}
                                />
                            )}
                        </For>
                    </div>
                    <Show when={repositoriesQuery.data.length === 0}>
                        <p>No public repositories.</p>
                    </Show>
                </Match>
            </Switch>
        </section>
    );

    return (
        <Switch>
            <Match when={profileQuery.isPending}>Loading ...</Match>
            <Match when={profileQuery.isError}>Error</Match>
            <Match
                when={
                    profileQuery.isSuccess &&
                    profileQuery.data.type === "Organization"
                }
            >
                <OrganizationPageLayout
                    profile={props.profile}
                    active="overview"
                >
                    {repositoryCards()}
                </OrganizationPageLayout>
            </Match>
            <Match when={profileQuery.isSuccess}>
                <UserPageLayout
                    profile={props.profile}
                    profileData={profileQuery}
                    active="overview"
                >
                    {repositoryCards()}
                </UserPageLayout>
            </Match>
        </Switch>
    );
}

export default Profile;
