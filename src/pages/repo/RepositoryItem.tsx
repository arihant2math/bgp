import { useQuery } from "@tanstack/solid-query";
import { getOctokit, parseRestOctokitResponse } from "../../lib/octokit.ts";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import { For, Match, Show, Switch } from "solid-js";
import BranchSelector from "../../components/BranchSelector.tsx";
import FileList from "../../components/FileList.tsx";
import FileRenderer from "../../components/FileRenderer.tsx";
import { repoCommitsHref, repoTreeHref } from "../../lib/hrefGen.ts";
import { decodeBase64Content } from "../../lib/content.ts";
import { fetchDirectoryCommitMetadata } from "../../lib/githubCommits.ts";

export type RepositoryItemProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string[];
};

function RepositoryItem(props: RepositoryItemProps) {
    const metadataQuery = useQuery(() => ({
        queryKey: ["repoMetadata", props.profile, props.repo],
        queryFn: () =>
            getOctokit()
                .rest.repos.get({
                    owner: props.profile,
                    repo: props.repo,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    // TODO: Standardize contents queries
    const contentsQuery = useQuery(() => ({
        queryKey: ["tree", props.profile, props.repo, props.tree, props.path],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({
                    owner: props.profile,
                    repo: props.repo,
                    path: props.path.join("/"),
                    ref: props.tree,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    const readmeQuery = useQuery(() => ({
        queryKey: ["readme", props.profile, props.repo, props.tree, props.path],
        queryFn: () =>
            getOctokit()
                .rest.repos.getReadmeInDirectory({
                    owner: props.profile,
                    repo: props.repo,
                    dir: props.path.join("/"),
                    ref: props.tree,
                })
                .then((res) => parseRestOctokitResponse(res)),
        enabled: contentsQuery.isSuccess && Array.isArray(contentsQuery.data),
        retry: false,
    }));

    const commitMetadataQuery = useQuery(() => ({
        queryKey: [
            "directoryCommitMetadata",
            props.profile,
            props.repo,
            props.tree,
            props.path,
        ],
        queryFn: () =>
            fetchDirectoryCommitMetadata({
                owner: props.profile,
                repo: props.repo,
                ref: props.tree,
                path: props.path.join("/"),
                itemPaths: Array.isArray(contentsQuery.data)
                    ? contentsQuery.data.map((item) => item.path)
                    : [],
            }),
        enabled: contentsQuery.isSuccess && Array.isArray(contentsQuery.data),
    }));

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <div class="mb-4 flex flex-wrap items-center gap-3">
                <BranchSelector
                    profile={props.profile}
                    repo={props.repo}
                    currentRef={props.tree}
                    defaultBranch={metadataQuery.data?.default_branch}
                    path={props.path}
                    compact
                />
                <nav class="min-w-0 flex-1" aria-label="Breadcrumbs">
                    <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--fgColor-muted)]">
                        <li class="min-w-0">
                            <a
                                href={repoTreeHref(
                                    props.profile,
                                    props.repo,
                                    props.tree,
                                )}
                                class="text-[var(--fgColor-accent)] hover:underline"
                            >
                                {props.repo}
                            </a>
                        </li>
                        <For each={props.path}>
                            {(segment, index) => (
                                <li class="flex min-w-0 items-center gap-2">
                                    <span aria-hidden="true">/</span>
                                    <Switch>
                                        <Match
                                            when={
                                                index() ===
                                                props.path.length - 1
                                            }
                                        >
                                            <span class="text-[var(--fgColor-default)]">
                                                {segment}
                                            </span>
                                        </Match>
                                        <Match
                                            when={
                                                index() < props.path.length - 1
                                            }
                                        >
                                            <a
                                                href={repoTreeHref(
                                                    props.profile,
                                                    props.repo,
                                                    props.tree,
                                                    props.path.slice(
                                                        0,
                                                        index() + 1,
                                                    ),
                                                )}
                                                class="text-[var(--fgColor-accent)] hover:underline"
                                            >
                                                {segment}
                                            </a>
                                        </Match>
                                    </Switch>
                                </li>
                            )}
                        </For>
                    </ol>
                </nav>
            </div>
            <Switch>
                <Match when={contentsQuery.isPending}>Loading ...</Match>
                <Match when={contentsQuery.isError}>Error</Match>
                <Match when={contentsQuery.isSuccess}>
                    <Switch>
                        <Match when={Array.isArray(contentsQuery.data)}>
                            <>
                                <FileList
                                    contents={contentsQuery.data}
                                    profile={props.profile}
                                    repo={props.repo}
                                    tree={props.tree}
                                    latestCommit={
                                        commitMetadataQuery.isError
                                            ? null
                                            : commitMetadataQuery.data
                                                  ?.latestCommit
                                    }
                                    latestCommitTotalCount={
                                        commitMetadataQuery.data?.totalCount
                                    }
                                    itemCommitsByPath={
                                        commitMetadataQuery.isError
                                            ? {}
                                            : commitMetadataQuery.data
                                                  ?.itemCommitsByPath
                                    }
                                    historyLabel="History"
                                    historyHref={repoCommitsHref(
                                        props.profile,
                                        props.repo,
                                        props.tree,
                                        props.path,
                                    )}
                                />
                                <Show when={readmeQuery.isSuccess}>
                                    <FileRenderer
                                        content={decodeBase64Content(
                                            readmeQuery.data.content,
                                        )}
                                        path={readmeQuery.data.path}
                                        markdownContext={`${props.profile}/${props.repo}`}
                                        rawUrl={readmeQuery.data.download_url}
                                        htmlUrl={readmeQuery.data.html_url}
                                        class="mt-4"
                                    />
                                </Show>
                            </>
                        </Match>
                        <Match when={contentsQuery.data.type === "file"}>
                            <FileRenderer
                                content={decodeBase64Content(
                                    contentsQuery.data.content,
                                )}
                                path={contentsQuery.data.path}
                                markdownContext={`${props.profile}/${props.repo}`}
                                rawUrl={contentsQuery.data.download_url}
                                htmlUrl={contentsQuery.data.html_url}
                            />
                        </Match>
                    </Switch>
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default RepositoryItem;
