import { Button, Label, Spinner } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch } from "solid-js";
import { approximateNumber as approx } from "approximate-number";
import Avatar from "../../components/Avatar.tsx";
import BranchSelector from "../../components/BranchSelector.tsx";
import FileList from "../../components/FileList.tsx";
import FileRenderer from "../../components/FileRenderer.tsx";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import { decodeBase64Content } from "../../lib/content.ts";
import { fetchDirectoryCommitMetadata } from "../../lib/githubCommits.ts";
import { repoCommitsHref } from "../../lib/hrefGen.ts";
import { getOctokit, parseRestOctokitResponse } from "../../lib/octokit.ts";

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
                .rest.repos.get({
                    owner: props.profile,
                    repo: props.repo,
                    ref: props.tree,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    // TODO: Standardize contents queries
    const contentsQuery = useQuery(() => ({
        queryKey: ["contents", props.profile, props.repo, props.tree],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({
                    owner: props.profile,
                    repo: props.repo,
                    path: "",
                    ref: props.tree ?? undefined,
                })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    const readmeQuery = useQuery(() => ({
        queryKey: ["readme", props.profile, props.repo, props.tree],
        queryFn: () =>
            getOctokit()
                .rest.repos.getReadme({
                    owner: props.profile,
                    repo: props.repo,
                    ref: props.tree ?? undefined,
                })
                .then((res) => parseRestOctokitResponse(res)),
        retry: false,
    }));

    const commitMetadataQuery = useQuery(() => {
        const tree = props.tree ?? metadataQuery.data?.default_branch;

        return {
            queryKey: [
                "directoryCommitMetadata",
                props.profile,
                props.repo,
                tree,
                "",
            ],
            queryFn: () =>
                fetchDirectoryCommitMetadata({
                    owner: props.profile,
                    repo: props.repo,
                    ref: tree ?? "",
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

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <Switch>
                <Match when={metadataQuery.isPending}>
                    <div class="flex items-center gap-3 text-sm text-[var(--fgColor-muted)]">
                        <Spinner
                            size="small"
                            srText={null}
                            aria-hidden="true"
                        />
                        Loading…
                    </div>
                </Match>
                <Match when={metadataQuery.isError}>Error</Match>
                <Match when={metadataQuery.isSuccess}>
                    <>
                        <div class="flex min-h-12 flex-row items-center gap-2">
                            <h1 class="flex flex-row items-center gap-2 text-xl">
                                <Avatar
                                    href={metadataQuery.data.owner.avatar_url}
                                    size={24}
                                    alt={`${metadataQuery.data.owner.login}'s avatar`}
                                />
                                {metadataQuery.data.name}
                            </h1>
                            <Label variant="secondary" size="small">
                                {metadataQuery.data.visibility}
                            </Label>
                            <div class="ml-auto flex items-center justify-end gap-2">
                                <Button
                                    size="small"
                                    leadingVisual={
                                        <Octicon
                                            name="eye"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                    }
                                    count={approx(
                                        metadataQuery.data.subscribers_count,
                                    )}
                                >
                                    Watch
                                </Button>
                                <Button
                                    size="small"
                                    leadingVisual={
                                        <Octicon
                                            name="repo-forked"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                    }
                                    count={approx(
                                        metadataQuery.data.forks_count,
                                    )}
                                >
                                    Fork
                                </Button>
                                <Button
                                    size="small"
                                    leadingVisual={
                                        <Octicon
                                            name="star"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                    }
                                    count={approx(
                                        metadataQuery.data.stargazers_count,
                                    )}
                                >
                                    Star
                                </Button>
                            </div>
                        </div>
                        <div class="my-2 border-t border-[var(--borderColor-default)]" />
                        <div class="flex flex-row gap-6">
                            <div class="flex-3">
                                <div class="mb-3">
                                    <BranchSelector
                                        profile={props.profile}
                                        repo={props.repo}
                                        currentRef={
                                            props.tree ??
                                            metadataQuery.data.default_branch
                                        }
                                        defaultBranch={
                                            metadataQuery.data.default_branch
                                        }
                                        path={[]}
                                        showCounts
                                    />
                                </div>
                                <Switch>
                                    <Match when={contentsQuery.isPending}>
                                        <div class="flex items-center gap-3 text-sm text-[var(--fgColor-muted)]">
                                            <Spinner
                                                size="small"
                                                srText={null}
                                                aria-hidden="true"
                                            />
                                            Loading…
                                        </div>
                                    </Match>
                                    <Match when={contentsQuery.isError}>
                                        Error
                                    </Match>
                                    <Match when={contentsQuery.isSuccess}>
                                        <FileList
                                            contents={contentsQuery.data}
                                            profile={props.profile}
                                            repo={props.repo}
                                            tree={
                                                props.tree ??
                                                metadataQuery.data
                                                    .default_branch
                                            }
                                            latestCommit={
                                                commitMetadataQuery.isError
                                                    ? null
                                                    : commitMetadataQuery.data
                                                          ?.latestCommit
                                            }
                                            latestCommitTotalCount={
                                                commitMetadataQuery.data
                                                    ?.totalCount
                                            }
                                            itemCommitsByPath={
                                                commitMetadataQuery.isError
                                                    ? {}
                                                    : commitMetadataQuery.data
                                                          ?.itemCommitsByPath
                                            }
                                            historyLabel={
                                                props.tree === null
                                                    ? undefined
                                                    : "History"
                                            }
                                            historyHref={repoCommitsHref(
                                                props.profile,
                                                props.repo,
                                                props.tree ??
                                                    metadataQuery.data
                                                        .default_branch,
                                            )}
                                        />
                                    </Match>
                                </Switch>
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
                            <div class="flex flex-1 flex-col gap-4">
                                <div>
                                    <b>About</b>
                                    <p>{metadataQuery.data.description}</p>
                                </div>

                                <Show
                                    when={metadataQuery.data.homepage !== null}
                                >
                                    <div class="flex items-center flex-row gap-2">
                                        <Octicon
                                            name="link"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        <a
                                            href={metadataQuery.data.homepage}
                                            class="text-[var(--fgColor-accent)] hover:underline"
                                        >
                                            {metadataQuery.data.homepage}
                                        </a>
                                    </div>
                                </Show>
                                <div class="flex flex-wrap items-start gap-2">
                                    <For each={metadataQuery.data.topics}>
                                        {(item) => (
                                            <Label
                                                variant="accent"
                                                size="small"
                                            >
                                                {item}
                                            </Label>
                                        )}
                                    </For>
                                </div>
                                <Show
                                    when={metadataQuery.data.license !== null}
                                >
                                    <div class="flex items-center flex-row gap-2">
                                        <Octicon
                                            name="law"
                                            size={16}
                                            aria-hidden="true"
                                        />{" "}
                                        <p class="text-sm">
                                            {metadataQuery.data.license.name}
                                        </p>
                                    </div>
                                </Show>

                                <div>
                                    <div class="flex items-center flex-row gap-2">
                                        <Octicon
                                            name="star"
                                            size={16}
                                            aria-hidden="true"
                                        />{" "}
                                        {approx(
                                            metadataQuery.data.stargazers_count,
                                        )}{" "}
                                        stars
                                    </div>
                                    <div class="flex items-center flex-row gap-2">
                                        <Octicon
                                            name="eye"
                                            size={16}
                                            aria-hidden="true"
                                        />{" "}
                                        {approx(
                                            metadataQuery.data
                                                .subscribers_count,
                                        )}{" "}
                                        watching
                                    </div>
                                    <div class="flex items-center flex-row gap-2">
                                        <Octicon
                                            name="repo-forked"
                                            size={16}
                                            aria-hidden="true"
                                        />{" "}
                                        {approx(metadataQuery.data.forks_count)}{" "}
                                        forks
                                    </div>
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
