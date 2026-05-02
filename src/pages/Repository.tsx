import RepoNavbar from "../components/RepoNavbar";
import { useQuery } from "@tanstack/solid-query";
import { Match, Switch } from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";

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
                    <div class="flex w-full flex-col mx-8">
                        <div class="flex flex-row">
                            <h1 class="text-xl">{metadataQuery.data.name}</h1>
                            <div class="badge badge-ghost text-xs">{metadataQuery.data.visibility}</div>
                            <div class="flex flex-1 items-end">
                                <button class="btn btn-xs">Watch</button>
                                <button class="btn btn-xs">Fork</button>
                                <button class="btn btn-xs">Star</button>
                            </div>
                        </div>
                        <div class="divider"></div>
                        <p>{metadataQuery.data.description}</p>
                    </div>
                </Match>
            </Switch>
        </main>
    );
}

export default Repository;
