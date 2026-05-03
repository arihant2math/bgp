import FileList from "../../components/FileList.tsx";
import FileRenderer from "../../components/FileRenderer.tsx";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import { Breadcrumbs, Token } from "@primer/solid";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch, createEffect, onCleanup } from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../../lib/octokit.ts";
import { approximateNumber as approx } from "approximate-number";
import Octicon from "../../components/Octicon.tsx";
import { repoCommitsHref, repoHref } from "../../lib/hrefGen.ts";
import { decodeBase64Content } from "../../lib/content.ts";
import { fetchDirectoryCommitMetadata } from "../../lib/githubCommits.ts";
import { fetchRepositoryTreeEntries } from "../../lib/githubTree.ts";
import { setRepoNavbarState } from "../../lib/navbarState.ts";

export type RepositoryProps = {
    profile: string;
    repo: string;
    tree?: string | null;
    path?: string[];
};

function Repository(props: RepositoryProps) {
    const path = () => props.path ?? [];
    const joinedPath = () => path().join("/");
    const hasPath = () => path().length > 0;
    const metadataQuery = useQuery(() => ({
        queryKey: ["repoMetadata", props.profile, props.repo],
        queryFn: () =>
            getOctokit()
                .rest.repos.get({
                    owner: props.profile,
                    repo: props.repo,
                    ref: props.tree,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    // TODO: Standardize contents queries
    const contentsQuery = useQuery(() => ({
        queryKey: ["contents", props.profile, props.repo, props.tree, path()],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({
                    owner: props.profile,
                    repo: props.repo,
                    path: joinedPath(),
                    ref: props.tree ?? undefined,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    const readmeQuery = useQuery(() => ({
        queryKey: ["readme", props.profile, props.repo, props.tree, path()],
        queryFn: () =>
            hasPath()
                ? getOctokit()
                      .rest.repos.getReadmeInDirectory({
                          owner: props.profile,
                          repo: props.repo,
                          dir: joinedPath(),
                          ref: props.tree ?? undefined,
                      })
                      .then((res) => parseRestOctokitResponse(res))
                : getOctokit()
                      .rest.repos.getReadme({
                          owner: props.profile,
                          repo: props.repo,
                          ref: props.tree ?? undefined,
                      })
                      .then((res) => parseRestOctokitResponse(res)),
        enabled: !hasPath() || (contentsQuery.isSuccess && Array.isArray(contentsQuery.data)),
        retry: false,
    }));

    const sidebarTreeEntriesQuery = useQuery(() => {
        const ref = props.tree ?? metadataQuery.data?.default_branch;

        return {
            queryKey: ["repoSidebarTreeEntries", props.profile, props.repo, ref],
            queryFn: () =>
                fetchRepositoryTreeEntries({
                    owner: props.profile,
                    repo: props.repo,
                    ref: ref ?? "",
                }),
            enabled: Boolean(ref),
        };
    });

    const treeEntriesQuery = useQuery(() => {
        const ref = props.tree ?? metadataQuery.data?.default_branch;

        return {
            queryKey: ["repoTreeEntries", props.profile, props.repo, ref, path()],
            queryFn: () =>
                fetchRepositoryTreeEntries({
                    owner: props.profile,
                    repo: props.repo,
                    ref: ref ?? "",
                    prefix: Array.isArray(contentsQuery.data) && hasPath() ? path() : undefined,
                }),
            enabled: Boolean(ref),
        };
    });

    const commitMetadataQuery = useQuery(() => {
        const tree = props.tree ?? metadataQuery.data?.default_branch;

        return {
            queryKey: [
                "directoryCommitMetadata",
                props.profile,
                props.repo,
                tree,
                path(),
            ],
            queryFn: () =>
                fetchDirectoryCommitMetadata({
                    owner: props.profile,
                    repo: props.repo,
                    ref: tree ?? "",
                    path: joinedPath(),
                    itemPaths: Array.isArray(contentsQuery.data)
                        ? contentsQuery.data.map((item) => item.path)
                        : [],
                }),
            enabled:
                metadataQuery.isSuccess &&
                contentsQuery.isSuccess &&
                Array.isArray(contentsQuery.data) &&
                Boolean(tree),
        };
    });

    createEffect(() => {
        if (!metadataQuery.data) return;

        setRepoNavbarState({
            avatarUrl: metadataQuery.data.owner.avatar_url,
            ownerLogin: metadataQuery.data.owner.login,
            repoName: metadataQuery.data.name,
            visibility: metadataQuery.data.visibility,
        });
    });

    onCleanup(() => {
        setRepoNavbarState(null);
    });

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <Switch>
                <Match when={metadataQuery.isPending}>Loading ...</Match>
                <Match when={metadataQuery.isError}>Error</Match>
                <Match when={metadataQuery.isSuccess}>
                    <>
                        <Show when={hasPath()}>
                            <div class="mb-4">
                                <Breadcrumbs>
                                    <Breadcrumbs.Item
                                        href={
                                            repoHref(props.profile, props.repo) +
                                            "/tree/" +
                                            (props.tree ?? metadataQuery.data.default_branch)
                                        }
                                    >
                                        {props.repo}
                                    </Breadcrumbs.Item>
                                    <For each={path()}>
                                        {(segment, index) => (
                                            <Breadcrumbs.Item
                                                as={
                                                    index() === path().length - 1
                                                        ? "span"
                                                        : "a"
                                                }
                                                selected={index() === path().length - 1}
                                                href={
                                                    index() === path().length - 1
                                                        ? undefined
                                                        : repoHref(props.profile, props.repo) +
                                                          "/tree/" +
                                                          (props.tree ?? metadataQuery.data.default_branch) +
                                                          "/" +
                                                          path()
                                                              .slice(0, index() + 1)
                                                              .join("/")
                                                }
                                            >
                                                {segment}
                                            </Breadcrumbs.Item>
                                        )}
                                    </For>
                                </Breadcrumbs>
                            </div>
                        </Show>
                        <div class="flex gap-6 items-start">
                            <Show when={hasPath()}>
                                <aside class="w-80 shrink-0">
                                    <FileList
                                        class="sticky top-4"
                                        containerHeight="70vh"
                                        contents={[]}
                                        entries={sidebarTreeEntriesQuery.data}
                                        tree={props.tree ?? metadataQuery.data.default_branch}
                                        repoUrl={repoHref(props.profile, props.repo)}
                                        selectedPath={joinedPath()}
                                        stateKey={`${props.profile}/${props.repo}:${props.tree ?? metadataQuery.data.default_branch}`}
                                        showHeader={false}
                                    />
                                </aside>
                            </Show>
                            <div class="min-w-0 flex-1">
                                <Switch>
                                    <Match when={contentsQuery.isPending}>Loading ...</Match>
                                    <Match when={contentsQuery.isError}>Error</Match>
                                    <Match when={contentsQuery.isSuccess && Array.isArray(contentsQuery.data)}>
                                        <div class="flex flex-row">
                                            <div class="flex-3">
                                                <div>
                                                    {props.tree ?? metadataQuery.data.default_branch}
                                                </div>
                                                <FileList
                                                    contents={contentsQuery.data}
                                                    tree={
                                                        props.tree ??
                                                        metadataQuery.data.default_branch
                                                    }
                                                    repoUrl={repoHref(
                                                        props.profile,
                                                        props.repo,
                                                    )}
                                                    pathPrefix={hasPath() ? path() : undefined}
                                                    latestCommit={
                                                        commitMetadataQuery.isError
                                                            ? null
                                                            : commitMetadataQuery.data?.latestCommit
                                                    }
                                                    latestCommitTotalCount={
                                                        commitMetadataQuery.data?.totalCount
                                                    }
                                                    itemCommitsByPath={
                                                        commitMetadataQuery.isError
                                                            ? {}
                                                            : commitMetadataQuery.data?.itemCommitsByPath
                                                    }
                                                    historyLabel={
                                                        props.tree === null ? undefined : "History"
                                                    }
                                                    historyHref={repoCommitsHref(
                                                        props.profile,
                                                        props.repo,
                                                        props.tree ?? metadataQuery.data.default_branch,
                                                        hasPath() ? path() : undefined,
                                                    )}
                                                />
                                                <Show when={readmeQuery.isSuccess}>
                                                    <FileRenderer
                                                        content={decodeBase64Content(
                                                            readmeQuery.data.content,
                                                        )}
                                                        path={readmeQuery.data.path}
                                                        markdownContext={`${props.profile}/${props.repo}`}
                                                        class="mt-4"
                                                    />
                                                </Show>
                                            </div>
                                            <Show when={!hasPath()}>
                                                <div class="flex-1 flex flex-col gap-4">
                                                    <div>
                                                        <b>About</b>
                                                        <p>{metadataQuery.data.description}</p>
                                                    </div>
                                                    <Show when={metadataQuery.data.homepage !== null}>
                                                        <div class="flex items-center flex-row gap-2">
                                                            <Octicon name="link" size={16} aria-hidden="true" />
                                                            <a href={metadataQuery.data.homepage}>
                                                                {metadataQuery.data.homepage}
                                                            </a>
                                                        </div>
                                                    </Show>
                                                    <div class="flex flex-wrap items-start gap-2">
                                                        <For each={metadataQuery.data.topics}>
                                                            {(item) => <Token text={item} />}
                                                        </For>
                                                    </div>
                                                    <Show when={metadataQuery.data.license !== null}>
                                                        <div class="flex items-center flex-row gap-2">
                                                            <Octicon name="law" size={16} aria-hidden="true" />
                                                            <p class="text-sm">
                                                                {metadataQuery.data.license.name}
                                                            </p>
                                                        </div>
                                                    </Show>
                                                    <div>
                                                        <div class="flex items-center flex-row gap-2">
                                                            <Octicon name="star" size={16} aria-hidden="true" />
                                                            {approx(metadataQuery.data.stargazers_count)} stars
                                                        </div>
                                                        <div class="flex items-center flex-row gap-2">
                                                            <Octicon name="eye" size={16} aria-hidden="true" />
                                                            {approx(metadataQuery.data.subscribers_count)} watching
                                                        </div>
                                                        <div class="flex items-center flex-row gap-2">
                                                            <Octicon name="repo-forked" size={16} aria-hidden="true" />
                                                            {approx(metadataQuery.data.forks_count)} forks
                                                        </div>
                                                    </div>
                                                </div>
                                            </Show>
                                        </div>
                                    </Match>
                                    <Match when={contentsQuery.isSuccess && !Array.isArray(contentsQuery.data)}>
                                        <FileRenderer
                                            content={decodeBase64Content(contentsQuery.data.content)}
                                            path={contentsQuery.data.path}
                                            markdownContext={`${props.profile}/${props.repo}`}
                                        />
                                    </Match>
                                </Switch>
                            </div>
                        </div>
                    </>
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default Repository;
