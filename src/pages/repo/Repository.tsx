import FileList from "../../components/FileList.tsx";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch } from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../../lib/octokit.ts";
import { approximateNumber as approx } from "approximate-number";
import Octicon from "../../components/Octicon.tsx";
import {repoHref} from "../../lib/hrefGen.ts";

export type RepositoryProps = {
    profile: string;
    repo: string;
    tree?: string | null;
};

function Repository(props: RepositoryProps) {
    const metadataQuery = useQuery(() => ({
        queryKey: ["repoMetadata", props.profile, props.repo],
        queryFn: () =>
            getOctokit()
                .rest.repos.get({ owner: props.profile, repo: props.repo, ref: props.tree })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    // TODO: Standardize contents queries
    const contentsQuery = useQuery(() => ({
        queryKey: ["contents", props.profile, props.repo],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({ owner: props.profile, repo: props.repo, path: "" })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <Switch>
                <Match when={metadataQuery.isPending}>Loading ...</Match>
                <Match when={metadataQuery.isError}>Error</Match>
                <Match when={metadataQuery.isSuccess}>
                    <>
                        <div class="flex min-h-12 flex-row items-center gap-2">
                            <h1 class="text-xl flex flex-row items-center gap-2">
                                <Octicon
                                    name={metadataQuery.data.fork ? "repo-forked" : "repo"}
                                    size={24}
                                    class="shrink-0 opacity-80"
                                    aria-hidden="true"
                                />
                                {metadataQuery.data.name}</h1>
                            <div class="badge badge-neutral badge-outline text-xs">{metadataQuery.data.visibility}</div>
                            <div class="ml-auto flex items-center justify-end gap-2">
                                <button class="btn btn-sm"><Octicon name="eye" size={16} aria-hidden="true" /> Watch <div class="badge badge-ghost text-xs">{approx(metadataQuery.data.subscribers_count)}</div></button>
                                <button class="btn btn-sm"><Octicon name="repo-forked" size={16} aria-hidden="true" /> Fork <div class="badge badge-ghost text-xs">{approx(metadataQuery.data.forks_count)}</div></button>
                                <button class="btn btn-sm"><Octicon name="star" size={16} aria-hidden="true" /> Star <div class="badge badge-ghost text-xs">{approx(metadataQuery.data.stargazers_count)}</div></button>
                            </div>
                        </div>
                        <div class="divider my-2"></div>
                        <div class="flex flex-row">
                            <div class="flex-3">
                                <div>{metadataQuery.data.default_branch}</div>
                                <Switch>
                                    <Match when={contentsQuery.isPending}>Loading ...</Match>
                                    <Match when={contentsQuery.isError}>Error</Match>
                                    <Match when={contentsQuery.isSuccess}>
                                        <FileList contents={contentsQuery.data} tree={metadataQuery.data.default_branch} repoUrl={repoHref(props.profile, props.repo)}/>
                                    </Match>
                                </Switch>
                            </div>
                            <div class="flex-1 flex flex-col gap-4">
                                <div>
                                    <b>About</b>
                                    <p>{metadataQuery.data.description}</p>
                                </div>

                                <Show when={metadataQuery.data.homepage !== null}>
                                    <div class="flex items-center flex-row gap-2"><Octicon name="link" size={16} aria-hidden="true" /><a href={metadataQuery.data.homepage}>{metadataQuery.data.homepage}</a></div>
                                </Show>
                                <div class="flex flex-wrap items-start gap-2">
                                    <For each={metadataQuery.data.topics}>
                                        {(item) =>
                                            <div class="badge badge-info badge-outline w-fit text-xs">{item}</div>
                                        }
                                    </For>
                                </div>
                                <Show when={metadataQuery.data.license !== null}>
                                    <div class="flex items-center flex-row gap-2"><Octicon name="law" size={16} aria-hidden="true" /> <p class="text-sm">{metadataQuery.data.license.name}</p></div>
                                </Show>

                                <div>
                                    <div class="flex items-center flex-row gap-2"><Octicon name="star" size={16} aria-hidden="true" /> {approx(metadataQuery.data.stargazers_count)} stars</div>
                                    <div class="flex items-center flex-row gap-2"><Octicon name="eye" size={16} aria-hidden="true" /> {approx(metadataQuery.data.subscribers_count)} watching</div>
                                    <div class="flex items-center flex-row gap-2"><Octicon name="repo-forked" size={16} aria-hidden="true" /> {approx(metadataQuery.data.forks_count)} forks</div>
                                </div>
                            </div>
                        </div>
                    </>
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default Repository;
