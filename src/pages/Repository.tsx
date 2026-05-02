import RepoNavbar from "../components/RepoNavbar";
import { useQuery } from "@tanstack/solid-query";
import { Match, Switch } from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";
import { approximateNumber as approx } from 'approximate-number';

export type RepositoryProps = {
    profile: string;
    repo: string;
};

function Repository(props: RepositoryProps) {
    const metadataQuery = useQuery(() => ({
        queryKey: ["repoMetadata", props.profile, props.repo],
        queryFn: () =>
            getOctokit()
                .rest.repos.get({ owner: props.profile, repo: props.repo })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <main>
            <RepoNavbar
                profile={props.profile}
                repo={props.repo}
                active="code"
            />
            <Switch>
                <Match when={metadataQuery.isPending}>Loading...</Match>
                <Match when={metadataQuery.isError}>Error</Match>
                <Match when={metadataQuery.isSuccess}>
                    <div class="flex flex-col mx-8">
                        <div class="flex min-h-12 flex-row items-center gap-2">
                            <h1 class="text-xl">{metadataQuery.data.name}</h1>
                            <div class="badge badge-neutral badge-outline text-xs">{metadataQuery.data.visibility}</div>
                            <div class="ml-auto flex items-center justify-end gap-2">
                                <button class="btn btn-sm">Watch <div class="badge badge-ghost text-xs">{approx(metadataQuery.data.subscribers_count)}</div></button>
                                <button class="btn btn-sm">Fork <div class="badge badge-ghost text-xs">{approx(metadataQuery.data.forks_count)}</div></button>
                                <button class="btn btn-sm">Star <div class="badge badge-ghost text-xs">{approx(metadataQuery.data.stargazers_count)}</div></button>
                            </div>
                        </div>
                        <div class="divider my-2"></div>
                        <p>{metadataQuery.data.description}</p>
                    </div>
                </Match>
            </Switch>
        </main>
    );
}

export default Repository;
