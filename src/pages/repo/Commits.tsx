import { useSearchParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch, createMemo } from "solid-js";
import { Button, Label, Link, Token } from "@primer/solid";
import Avatar from "../../components/Avatar.tsx";
import Octicon from "../../components/Octicon.tsx";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import { fetchCommitHistory } from "../../lib/githubCommits.ts";
import type { CommitSummary } from "../../lib/githubCommits.ts";
import { repoCommitsHref } from "../../lib/hrefGen.ts";

const COMMITS_PER_PAGE = 30;

export type CommitsProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string[];
};

function pageNumber(value: string | undefined) {
    const page = Number.parseInt(value ?? "1", 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

function authorsText(commit: CommitSummary) {
    const names = commit.authors.map(
        (author) => author.login ?? author.name ?? author.email ?? "Unknown",
    );

    return names.join(", ") || "Unknown author";
}

function commitPageHref(props: CommitsProps, page: number) {
    const href = repoCommitsHref(
        props.profile,
        props.repo,
        props.tree,
        props.path,
    );
    return page > 1 ? `${href}?page=${page}` : href;
}

function CommitRow(props: { commit: CommitSummary }) {
    const primaryAuthor = () => props.commit.authors[0];

    return (
        <li class="flex items-start gap-3 border-b border-base-300 px-4 py-4 last:border-b-0">
            <Show
                when={primaryAuthor()?.avatarUrl}
                fallback={
                    <div class="grid size-10 place-items-center rounded-full border border-base-300 bg-base-100">
                        <Octicon name="person" size={18} aria-hidden="true" />
                    </div>
                }
            >
                {(avatarUrl) => (
                    <Avatar
                        href={avatarUrl()}
                        size={40}
                        alt={`${authorsText(props.commit)}'s avatar`}
                    />
                )}
            </Show>
            <div class="min-w-0 flex-1">
                <div class="font-medium">
                    <Show
                        when={props.commit.commitUrl}
                        fallback={props.commit.message}
                    >
                        {(commitUrl) => (
                            <Link
                                href={commitUrl()}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {props.commit.message}
                            </Link>
                        )}
                    </Show>
                </div>
                <div class="mt-1 text-sm opacity-70">
                    {authorsText(props.commit)} committed {" "}
                    <time
                        dateTime={props.commit.committedDate}
                        title={new Date(
                            props.commit.committedDate,
                        ).toLocaleString()}
                    >
                        {new Date(
                            props.commit.committedDate,
                        ).toLocaleDateString()}
                    </time>
                </div>
            </div>
            <Show
                when={props.commit.commitUrl}
                fallback={
                    <Button type="button" variant="invisible" size="small" class="font-mono">
                        {props.commit.abbreviatedOid}
                    </Button>
                }
            >
                {(commitUrl) => (
                    <Button
                        as="a"
                        href={commitUrl()}
                        target="_blank"
                        rel="noreferrer"
                        variant="invisible"
                        size="small"
                        class="font-mono"
                    >
                        {props.commit.abbreviatedOid}
                    </Button>
                )}
            </Show>
        </li>
    );
}

function Commits(props: CommitsProps) {
    const [searchParams] = useSearchParams<{ page?: string }>();
    const page = createMemo(() => pageNumber(searchParams.page));
    const path = createMemo(() => props.path.join("/"));
    const commitsQuery = useQuery(() => ({
        queryKey: [
            "commitHistory",
            props.profile,
            props.repo,
            props.tree,
            path(),
            page(),
        ],
        queryFn: () =>
            fetchCommitHistory({
                owner: props.profile,
                repo: props.repo,
                ref: props.tree,
                path: path(),
                page: page(),
                perPage: COMMITS_PER_PAGE,
            }),
    }));

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <div class="mb-4 flex flex-wrap items-center gap-3">
                <h1 class="text-xl font-semibold">Commit history</h1>
                <Label>{props.tree}</Label>
                <Show when={path()}>
                    {(currentPath) => (
                        <Token text={`/${currentPath()}`} />
                    )}
                </Show>
            </div>

            <Switch>
                <Match when={commitsQuery.isPending}>Loading commits ...</Match>
                <Match when={commitsQuery.isError}>Error loading commits</Match>
                <Match when={commitsQuery.data}>
                    {(history) => (
                        <>
                            <Show
                                when={history().commits.length > 0}
                                fallback={
                                    <div class="rounded-md border border-base-300 bg-base-100 p-6 text-center opacity-70">
                                        No commits found.
                                    </div>
                                }
                            >
                                <ul class="list rounded-md border border-base-300 bg-base-100">
                                    <For each={history().commits}>
                                        {(commit) => (
                                            <CommitRow commit={commit} />
                                        )}
                                    </For>
                                </ul>
                            </Show>

                            <div class="mt-6 flex justify-center gap-2">
                                <Show
                                    when={history().hasPrevious}
                                    fallback={
                                        <Button type="button" disabled>
                                            Previous
                                        </Button>
                                    }
                                >
                                    <Button as="a" href={commitPageHref(props, page() - 1)}>
                                        Previous
                                    </Button>
                                </Show>
                                <Show
                                    when={history().hasNext}
                                    fallback={
                                        <Button type="button" disabled>
                                            Next
                                        </Button>
                                    }
                                >
                                    <Button as="a" href={commitPageHref(props, page() + 1)}>
                                        Next
                                    </Button>
                                </Show>
                            </div>
                        </>
                    )}
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default Commits;
