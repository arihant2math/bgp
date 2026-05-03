import { useQuery } from "@tanstack/solid-query";
import { getOctokit, parseRestOctokitResponse } from "../../lib/octokit.ts";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import { Breadcrumbs } from "../../vendor/primer-solid";
import { For, Match, Show, Switch } from "solid-js";
import FileList from "../../components/FileList.tsx";
import FileRenderer from "../../components/FileRenderer.tsx";
import { repoCommitsHref, repoHref } from "../../lib/hrefGen.ts";
import { decodeBase64Content } from "../../lib/content.ts";
import { fetchDirectoryCommitMetadata } from "../../lib/githubCommits.ts";
import { fetchRepositoryTreeEntries } from "../../lib/githubTree.ts";

export type RepositoryItemProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string[];
};

function RepositoryItem(props: RepositoryItemProps) {
    // TODO: Standardize contents queries
    console.log(props);
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

    const treeEntriesQuery = useQuery(() => ({
        queryKey: ["repoTreeEntries", props.profile, props.repo, props.tree, props.path],
        queryFn: () =>
            fetchRepositoryTreeEntries({
                owner: props.profile,
                repo: props.repo,
                ref: props.tree,
                prefix: props.path,
            }),
        enabled: contentsQuery.isSuccess && Array.isArray(contentsQuery.data),
    }));

    const sidebarTreeEntriesQuery = useQuery(() => ({
        queryKey: ["repoTreeSidebarEntries", props.profile, props.repo, props.tree],
        queryFn: () =>
            fetchRepositoryTreeEntries({
                owner: props.profile,
                repo: props.repo,
                ref: props.tree,
            }),
        enabled: contentsQuery.isSuccess && !Array.isArray(contentsQuery.data),
    }));

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <Breadcrumbs>
                <Breadcrumbs.Item
                    href={
                        repoHref(props.profile, props.repo) +
                        "/tree/" +
                        props.tree
                    }
                >
                    {props.repo}
                </Breadcrumbs.Item>
                <For each={props.path}>
                    {(segment, index) => (
                        <Breadcrumbs.Item
                            as={index() === props.path.length - 1 ? "span" : "a"}
                            selected={index() === props.path.length - 1}
                            href={
                                index() === props.path.length - 1
                                    ? undefined
                                    : repoHref(
                                          props.profile,
                                          props.repo,
                                      ) +
                                      "/tree/" +
                                      props.tree +
                                      "/" +
                                      props.path
                                          .slice(0, index() + 1)
                                          .join("/")
                            }
                        >
                            {segment}
                        </Breadcrumbs.Item>
                    )}
                </For>
            </Breadcrumbs>
            <Switch>
                <Match when={contentsQuery.isPending}>Loading ...</Match>
                <Match when={contentsQuery.isError}>Error</Match>
                <Match when={contentsQuery.isSuccess}>
                    <Switch>
                        <Match when={Array.isArray(contentsQuery.data)}>
                            <>
                                <FileList
                                    contents={contentsQuery.data}
                                    entries={treeEntriesQuery.data}
                                    tree={props.tree}
                                    repoUrl={repoHref(
                                        props.profile,
                                        props.repo,
                                    )}
                                    pathPrefix={props.path}
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
                                        class="mt-4"
                                    />
                                </Show>
                            </>
                        </Match>
                        <Match when={contentsQuery.data.type === "file"}>
                            <div class="flex gap-6 items-start">
                                <aside class="w-80 shrink-0">
                                    <FileList
                                        class="sticky top-4"
                                        containerHeight="70vh"
                                        contents={[]}
                                        entries={sidebarTreeEntriesQuery.data}
                                        tree={props.tree}
                                        repoUrl={repoHref(
                                            props.profile,
                                            props.repo,
                                        )}
                                        selectedPath={props.path.join("/")}
                                        showHeader={false}
                                    />
                                </aside>
                                <div class="min-w-0 flex-1">
                                    <FileRenderer
                                        content={decodeBase64Content(
                                            contentsQuery.data.content,
                                        )}
                                        path={contentsQuery.data.path}
                                        markdownContext={`${props.profile}/${props.repo}`}
                                    />
                                </div>
                            </div>
                        </Match>
                    </Switch>
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default RepositoryItem;
