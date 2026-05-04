import { Button, Spinner } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { CommitAuthor, CommitSummary } from "../lib/githubCommits.ts";
import Avatar from "./Avatar.tsx";
import RelativeDate from "./RelativeDate.tsx";

export type CommitListItemProps = {
    commit?: CommitSummary | null;
    historyLabel?: string;
    historyHref?: string;
};

const MAX_VISIBLE_AVATARS = 3;
const MAX_VISIBLE_AUTHOR_NAMES = 2;
const COLLAPSED_MESSAGE_LENGTH = 96;

function displayName(author: CommitAuthor) {
    return author.login ?? author.name ?? author.email ?? "Unknown";
}

function authorsLabel(authors: CommitAuthor[], totalCount: number) {
    if (authors.length === 0) return "Unknown author";

    const visibleNames = authors
        .slice(0, MAX_VISIBLE_AUTHOR_NAMES)
        .map(displayName);
    const hiddenCount = Math.max(totalCount - visibleNames.length, 0);

    if (hiddenCount > 0)
        return `${visibleNames.join(", ")} and ${hiddenCount} more`;
    if (visibleNames.length === 2)
        return `${visibleNames[0]} and ${visibleNames[1]}`;
    return visibleNames[0] ?? "Unknown author";
}

function HistoryButton(props: { label?: string; href?: string }) {
    const label = () => props.label ?? "History";

    return (
        <Show
            when={props.href}
            fallback={
                <Button type="button" size="small" variant="invisible">
                    {label()}
                </Button>
            }
        >
            {(href) => (
                <Button as="a" href={href()} size="small" variant="invisible">
                    {label()}
                </Button>
            )}
        </Show>
    );
}

function AuthorIcon(props: { author: CommitAuthor; offset: boolean }) {
    const offsetClass = () => (props.offset ? "-ml-2" : "");

    return (
        <Show
            when={props.author.avatarUrl}
            fallback={
                <div
                    class={`grid place-items-center rounded-full border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] ring-2 ring-[var(--bgColor-default)] ${offsetClass()}`}
                    style={{ width: "24px", height: "24px" }}
                    title={displayName(props.author)}
                >
                    <Octicon name="person" size={14} aria-hidden="true" />
                </div>
            }
        >
            {(avatarUrl) => (
                <Avatar
                    href={avatarUrl()}
                    size={24}
                    alt={`${displayName(props.author)}'s avatar`}
                    class={`ring-2 ring-[var(--bgColor-default)] ${offsetClass()}`}
                />
            )}
        </Show>
    );
}

function CommitBody(props: CommitListItemProps & { commit: CommitSummary }) {
    const [expanded, setExpanded] = createSignal(false);
    const visibleAuthors = createMemo(() =>
        props.commit.authors.slice(0, MAX_VISIBLE_AVATARS),
    );
    const hiddenAvatarCount = createMemo(() =>
        Math.max(props.commit.authorTotalCount - visibleAuthors().length, 0),
    );
    const needsExpansion = createMemo(
        () => props.commit.message.length > COLLAPSED_MESSAGE_LENGTH,
    );
    const shownMessage = createMemo(() => {
        if (expanded() || !needsExpansion()) return props.commit.message;
        return `${props.commit.message.slice(0, COLLAPSED_MESSAGE_LENGTH).trimEnd()}…`;
    });

    return (
        <div
            class={`flex w-full min-w-0 items-center gap-2 text-sm ${expanded() ? "flex-wrap" : ""}`}
        >
            <div class="flex shrink-0 items-center">
                <For each={visibleAuthors()}>
                    {(author, index) => (
                        <AuthorIcon author={author} offset={index() > 0} />
                    )}
                </For>
                <Show when={hiddenAvatarCount() > 0}>
                    <div
                        class="-ml-2 grid place-items-center rounded-full border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] px-1.5 text-[10px] font-medium ring-2 ring-[var(--bgColor-default)]"
                        style={{ height: "24px", "min-width": "24px" }}
                    >
                        +{hiddenAvatarCount()}
                    </div>
                </Show>
            </div>
            <span
                class="max-w-48 shrink-0 truncate font-medium"
                title={authorsLabel(
                    props.commit.authors,
                    props.commit.authorTotalCount,
                )}
            >
                {authorsLabel(
                    props.commit.authors,
                    props.commit.authorTotalCount,
                )}
            </span>
            <span
                class={`${expanded() ? "whitespace-normal" : "truncate"} min-w-0`}
                title={props.commit.message}
            >
                {shownMessage()}
            </span>
            <Show when={needsExpansion()}>
                <Button
                    icon={
                        <Octicon
                            name={expanded() ? "chevron-up" : "chevron-down"}
                            size={14}
                            aria-hidden="true"
                        />
                    }
                    type="button"
                    size="small"
                    variant="invisible"
                    class="shrink-0"
                    aria-label={
                        expanded()
                            ? "Collapse commit message"
                            : "Expand commit message"
                    }
                    onClick={() => setExpanded((value) => !value)}
                />
            </Show>
            <div class="ml-auto flex shrink-0 items-center gap-2">
                <div class="flex items-center gap-2 text-xs text-[var(--fgColor-muted)]">
                    <Show
                        when={props.commit.commitUrl}
                        fallback={
                            <span class="font-mono">
                                {props.commit.abbreviatedOid}
                            </span>
                        }
                    >
                        {(commitUrl) => (
                            <a
                                href={commitUrl()}
                                class="font-mono text-[var(--fgColor-accent)] hover:underline"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {props.commit.abbreviatedOid}
                            </a>
                        )}
                    </Show>
                    <span aria-hidden="true">·</span>
                    <RelativeDate datetime={props.commit.committedDate} />
                </div>
                <HistoryButton
                    label={props.historyLabel}
                    href={props.historyHref}
                />
            </div>
        </div>
    );
}

function CommitListItem(props: CommitListItemProps) {
    return (
        <Show
            when={props.commit !== undefined}
            fallback={
                <div class="flex w-full items-center gap-2 text-sm">
                    <Spinner size="small" srText={null} aria-hidden="true" />
                    <span class="text-[var(--fgColor-muted)]">
                        Loading latest commit…
                    </span>
                    <div class="ml-auto">
                        <HistoryButton
                            label={props.historyLabel}
                            href={props.historyHref}
                        />
                    </div>
                </div>
            }
        >
            <Show
                when={props.commit}
                fallback={
                    <div class="flex w-full items-center gap-2 text-sm">
                        <Octicon
                            name="git-commit"
                            size={16}
                            aria-hidden="true"
                        />
                        <span class="text-[var(--fgColor-muted)]">
                            No commits yet
                        </span>
                        <div class="ml-auto">
                            <HistoryButton
                                label={props.historyLabel}
                                href={props.historyHref}
                            />
                        </div>
                    </div>
                }
            >
                {(commit) => (
                    <CommitBody
                        commit={commit()}
                        historyLabel={props.historyLabel}
                        historyHref={props.historyHref}
                    />
                )}
            </Show>
        </Show>
    );
}

export default CommitListItem;
