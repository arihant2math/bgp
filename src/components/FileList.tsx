import { Octicon } from "@primer/solid/octicon";
import { createMemo, For, Show } from "solid-js";
import type { CommitSummary } from "../lib/githubCommits.ts";
import { repoTreeHref } from "../lib/hrefGen.ts";
import CommitListItem from "./CommitListItem.tsx";
import RelativeDate from "./RelativeDate.tsx";

const commitCountFormatter = new Intl.NumberFormat();

function commitCountLabel(count?: number) {
    if (count === undefined) return "Commits";
    return `${commitCountFormatter.format(count)} ${count === 1 ? "commit" : "commits"}`;
}

export type FileListProps = {
    contents: any[];
    profile: string;
    repo: string;
    tree: string;
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
        <ul class="overflow-hidden rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)]">
            <li class="border-b border-[var(--borderColor-muted)] px-4 py-3">
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
                        <li class="grid gap-3 border-b border-[var(--borderColor-muted)] px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center">
                            <a
                                href={repoTreeHref(
                                    props.profile,
                                    props.repo,
                                    props.tree,
                                    item.path.split("/"),
                                )}
                                class="flex min-w-0 items-center gap-2 text-[var(--fgColor-default)] hover:text-[var(--fgColor-accent)] hover:underline"
                            >
                                <Octicon
                                    name={
                                        item.type === "dir"
                                            ? "file-directory-fill"
                                            : "file"
                                    }
                                    size={16}
                                    aria-hidden="true"
                                    class="shrink-0"
                                />
                                <span class="truncate">{item.name}</span>
                            </a>
                            <div
                                class="min-w-0 truncate text-sm text-[var(--fgColor-muted)]"
                                title={itemCommit()?.message}
                            >
                                <Show
                                    when={props.itemCommitsByPath !== undefined}
                                    fallback={
                                        <span class="text-[var(--fgColor-muted)]">
                                            Loading commit…
                                        </span>
                                    }
                                >
                                    <Show
                                        when={itemCommit()}
                                        fallback={
                                            <span class="text-[var(--fgColor-muted)]">
                                                —
                                            </span>
                                        }
                                    >
                                        {(commit) => commit().message}
                                    </Show>
                                </Show>
                            </div>
                            <div class="shrink-0 text-xs text-[var(--fgColor-muted)]">
                                <Show
                                    when={props.itemCommitsByPath !== undefined}
                                    fallback={<span>—</span>}
                                >
                                    <Show
                                        when={itemCommit()}
                                        fallback={<span>—</span>}
                                    >
                                        {(commit) => (
                                            <RelativeDate
                                                datetime={
                                                    commit().committedDate
                                                }
                                            />
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
