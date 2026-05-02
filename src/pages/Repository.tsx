import RepoNavbar from "../components/RepoNavbar";
import { useQuery } from "@tanstack/solid-query";
import {For, Match, Switch} from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";
import { approximateNumber as approx } from 'approximate-number';
import Octicon from "../components/Octicon.tsx";

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

    let contentsQuery = useQuery(() => ({
        queryKey: ["contents", props.profile, props.repo],
        queryFn: () =>

            getOctokit()
                .rest.repos.getContent({ owner: props.profile, repo: props.repo, path: "" })
                .then((res) => {
                    let data = parseRestOctokitResponse(res);
                    data.sort((a, b) => {
                        a.type.localeCompare(b.type)
                    });
                    return data;
                }),
    }));

    return (
        <main>
            <RepoNavbar
                profile={props.profile}
                repo={props.repo}
                active="code"
            />
            <Switch>
                <Match when={metadataQuery.isPending}>Loading ...</Match>
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
                        <div class="flex flex-row">
                            <div class="flex-3">
                                {metadataQuery.data.default_branch}
                                <Switch>
                                    <Match when={contentsQuery.isPending}>Loading ...</Match>
                                    <Match when={contentsQuery.isError}>Error</Match>
                                    <Match when={contentsQuery.isSuccess}>
                                        <ul class="list">
                                            <For each={contentsQuery.data}>
                                                {(item, index) =>
                                                    <li class="list-row">
                                                        <a href="#" class="flex items-center gap-2">
                                                            <Switch>
                                                                <Match when={item.type === "dir"}>
                                                                    <Octicon name="file-directory" size={16} aria-hidden="true" />
                                                                </Match>
                                                                <Match when={item.type === "file"}>
                                                                    <Octicon name="file" size={16} aria-hidden="true" />
                                                                </Match>
                                                            </Switch>
                                                            {item.name}
                                                        </a>
                                                    </li>
                                                }
                                            </For>
                                        </ul>
                                    </Match>
                                </Switch>
                            </div>
                            <div class="flex-1">
                                <b>About</b>
                                <p>{metadataQuery.data.description}</p>
                            </div>
                        </div>
                    </div>
                </Match>
            </Switch>
        </main>
    );
}

export default Repository;
