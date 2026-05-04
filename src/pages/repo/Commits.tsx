import { useSearchParams } from "@solidjs/router";
import {
    Button,
    Heading,
    Label,
    Link,
    Pagination,
    Spinner,
    Text,
} from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch, createMemo } from "solid-js";
import Avatar from "../../components/Avatar.tsx";
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
        <li class="flex items-start gap-4 px-4 py-4">
            <Show
                when={primaryAuthor()?.avatarUrl}
                fallback={
                    <div class="grid size-10 place-items-center rounded-full border border-[var(--borderColor-default)] bg-[var(--bgColor-muted)]">
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
                <Heading as="h2" size="small">
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
                </Heading>
                <Text
                    as="p"
                    size="small"
                    style={{
                        color: "var(--fgColor-muted)",
                        "margin-top": "0.25rem",
                    }}
                >
                    {authorsText(props.commit)} committed{" "}
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
                </Text>
            </div>
            <Show
                when={props.commit.commitUrl}
                fallback={
                    <Button
                        size="small"
                        variant="invisible"
                        class="font-mono"
                        disabled
                    >
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
                        size="small"
                        variant="invisible"
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
                <Heading as="h1" size="large">
                    Commit history
                </Heading>
                <Label variant="secondary">{props.tree}</Label>
                <Show when={path()}>
                    {(currentPath) => (
                        <Label variant="default">/{currentPath()}</Label>
                    )}
                </Show>
            </div>

            <Switch>
                <Match when={commitsQuery.isPending}>
                    <div class="flex items-center gap-3 text-sm text-[var(--fgColor-muted)]">
                        <Spinner
                            size="small"
                            srText={null}
                            aria-hidden="true"
                        />
                        <Text as="span" size="small">
                            Loading commits…
                        </Text>
                    </div>
                </Match>
                <Match when={commitsQuery.isError}>
                    <Text>Error loading commits</Text>
                </Match>
                <Match when={commitsQuery.data}>
                    {(history) => (
                        <>
                            <Show
                                when={history().commits.length > 0}
                                fallback={
                                    <div class="rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-6 text-center text-[var(--fgColor-muted)]">
                                        <Text as="p" size="small">
                                            No commits found.
                                        </Text>
                                    </div>
                                }
                            >
                                <ul class="overflow-hidden rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] divide-y divide-[var(--borderColor-muted)]">
                                    <For each={history().commits}>
                                        {(commit) => (
                                            <CommitRow commit={commit} />
                                        )}
                                    </For>
                                </ul>
                            </Show>

                            <Pagination
                                currentPage={page()}
                                pageCount={page() + (history().hasNext ? 1 : 0)}
                                hrefBuilder={(nextPage) =>
                                    commitPageHref(props, nextPage)
                                }
                                showPages={false}
                                aria-label="Commit history pagination"
                                class="mt-6"
                            />
                        </>
                    )}
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default Commits;
