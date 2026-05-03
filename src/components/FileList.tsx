import { createMemo, For, Show } from "solid-js";
import { format } from "timeago.js";
import type { CommitSummary } from "../lib/githubCommits.ts";
import CommitListItem from "./CommitListItem.tsx";
import { Octicon } from "@primer/solid/octicon";

const commitCountFormatter = new Intl.NumberFormat();

function commitCountLabel(count?: number) {
    if (count === undefined) return "Commits";
    return `${commitCountFormatter.format(count)} ${count === 1 ? "commit" : "commits"}`;
}

export type FileListProps = {
    contents: any[];
    tree: string;
    repoUrl: string;
    latestCommit?: CommitSummary | null;
    latestCommitTotalCount?: number;
    itemCommitsByPath?: Record<string, CommitSummary | null>;
    historyLabel?: string;
    historyHref?: string;
};

function FileList(props: FileListProps) {
    const sortedContents = createMemo(() =>
        [...props.contents].sort((a, b) => {
            const aIsDir = a.type === "dir";
            const bIsDir = b.type === "dir";

            if (aIsDir === bIsDir) return 0;
            return aIsDir ? -1 : 1;
        }),
    );

    const headerHistoryLabel = () =>
        props.historyLabel ?? commitCountLabel(props.latestCommitTotalCount);

    return (
        <ul class="list rounded-md border border-base-300 bg-base-100">
            <li class="list-row">
                <CommitListItem
                    commit={props.latestCommit}
                    historyLabel={headerHistoryLabel()}
                    historyHref={props.historyHref}
                />
            </li>
            <For each={sortedContents()}>
                {(item) => {
                    const itemCommit = () =>
                        props.itemCommitsByPath?.[item.path];

                    return (
                        <li class="list-row">
                            <a
                                href={
                                    props.repoUrl +
                                    "/" +
                                    "tree" +
                                    "/" +
                                    props.tree +
                                    "/" +
                                    item.path
                                }
                                class="flex min-w-0 items-center gap-2"
                            >
                                <Octicon
                                    name={
                                        item.type === "dir"
                                            ? "file-directory-fill"
                                            : "file"
                                    }
                                    size={16}
                                    aria-hidden="true"
                                    class="shrink-0 stroke-neutral-content fill-neutral-content"
                                />
                                <span class="truncate">{item.name}</span>
                            </a>
                            <div
                                class="min-w-0 truncate opacity-80"
                                title={itemCommit()?.message}
                            >
                                <Show
                                    when={props.itemCommitsByPath !== undefined}
                                    fallback={
                                        <span class="opacity-50">
                                            Loading commit…
                                        </span>
                                    }
                                >
                                    <Show
                                        when={itemCommit()}
                                        fallback={
                                            <span class="opacity-50">—</span>
                                        }
                                    >
                                        {(commit) => commit().message}
                                    </Show>
                                </Show>
                            </div>
                            <div class="shrink-0 text-xs opacity-70">
                                <Show
                                    when={props.itemCommitsByPath !== undefined}
                                    fallback={<span>—</span>}
                                >
                                    <Show
                                        when={itemCommit()}
                                        fallback={<span>—</span>}
                                    >
                                        {(commit) => (
                                            <time
                                                dateTime={
                                                    commit().committedDate
                                                }
                                                title={new Date(
                                                    commit().committedDate,
                                                ).toLocaleString()}
                                            >
                                                {format(commit().committedDate)}
                                            </time>
                                        )}
                                    </Show>
                                </Show>
                            </div>
                        </li>
                    );
                }}
            </For>
        </ul>
    );
}

export default FileList;
