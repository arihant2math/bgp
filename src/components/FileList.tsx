import { useNavigate } from "@solidjs/router";
import { FileTree } from "@pierre/trees";
import { createEffect, createMemo, onCleanup } from "solid-js";
import type { CommitSummary } from "../lib/githubCommits.ts";
import type { RepoTreeEntry } from "../lib/githubTree.ts";
import CommitListItem from "./CommitListItem.tsx";

const commitCountFormatter = new Intl.NumberFormat();

function commitCountLabel(count?: number) {
    if (count === undefined) return "Commits";
    return `${commitCountFormatter.format(count)} ${count === 1 ? "commit" : "commits"}`;
}

export type FileListProps = {
    contents: any[];
    tree: string;
    repoUrl: string;
    entries?: RepoTreeEntry[];
    pathPrefix?: string[];
    latestCommit?: CommitSummary | null;
    latestCommitTotalCount?: number;
    itemCommitsByPath?: Record<string, CommitSummary | null>;
    historyLabel?: string;
    historyHref?: string;
    showHeader?: boolean;
    selectedPath?: string;
    containerHeight?: string;
    stateKey?: string;
    class?: string;
};

function itemHref(repoUrl: string, tree: string, path: string) {
    return `${repoUrl}/tree/${tree}/${path}`;
}

function treeItemPath(item: { path: string; type: string }) {
    return item.type === "dir" ? `${item.path}/` : item.path;
}

function absoluteItemPath(pathPrefix: string[] | undefined, path: string) {
    const prefix = pathPrefix?.join("/");
    return prefix ? `${prefix}/${path}` : path;
}

function readExpandedPaths(stateKey: string | undefined) {
    if (!stateKey || typeof window === "undefined") return undefined;

    const store = ((window as typeof window & {
        __fileTreeExpandedPaths?: Record<string, string[]>;
    }).__fileTreeExpandedPaths ??= {});

    return store[stateKey];
}

function writeExpandedPaths(stateKey: string | undefined, container: HTMLDivElement) {
    if (!stateKey || typeof window === "undefined") return;

    const store = ((window as typeof window & {
        __fileTreeExpandedPaths?: Record<string, string[]>;
    }).__fileTreeExpandedPaths ??= {});

    store[stateKey] = Array.from(
        container.querySelectorAll<HTMLElement>(
            '[data-item-type="folder"][aria-expanded="true"]',
        ),
        (element) => element.dataset.itemPath ?? "",
    ).filter(Boolean);
}

function FileList(props: FileListProps) {
    const navigate = useNavigate();
    const sortedContents = createMemo(() =>
        [...(props.entries ?? props.contents)].sort((a, b) => {
            const aIsDir = a.type === "dir";
            const bIsDir = b.type === "dir";

            if (aIsDir === bIsDir) return a.path.localeCompare(b.path);
            return aIsDir ? -1 : 1;
        }),
    );
    const displayPathToItem = createMemo(
        () =>
            new Map(
                sortedContents().map((item) => [treeItemPath(item), item] as const),
            ),
    );
    const treePaths = createMemo(() =>
        sortedContents().map((item) => treeItemPath(item)),
    );

    const headerHistoryLabel = () =>
        props.historyLabel ?? commitCountLabel(props.latestCommitTotalCount);

    let container!: HTMLDivElement;
    let fileTree: FileTree | undefined;
    let lastPathsKey: string | undefined;

    createEffect(() => {
        const paths = treePaths();
        const pathsKey = paths.join("\n");

        container.style.height =
            props.containerHeight ?? `${Math.max(paths.length, 1) * 30}px`;
        container.style.setProperty("--trees-fg-override", "var(--color-base-content)");
        container.style.setProperty("--trees-fg-muted-override", "color-mix(in oklab, var(--color-base-content) 65%, transparent)");
        container.style.setProperty("--trees-bg-override", "var(--color-base-100)");
        container.style.setProperty("--trees-bg-muted-override", "var(--color-base-200)");
        container.style.setProperty("--trees-border-color-override", "var(--color-base-300)");
        container.style.setProperty("--trees-selected-fg-override", "var(--color-base-content)");
        container.style.setProperty("--trees-selected-bg-override", "color-mix(in oklab, #0969da 14%, var(--color-base-100))");
        container.style.setProperty("--trees-selected-focused-border-color-override", "#0969da");
        container.style.setProperty("--trees-focus-ring-color-override", "#0969da");
        container.style.setProperty("--trees-indent-guide-bg-override", "transparent");
        container.style.setProperty("--trees-font-family-override", "inherit");

        if (!fileTree) {
            fileTree = new FileTree({
                initialExpansion: "closed",
                initialExpandedPaths: readExpandedPaths(props.stateKey),
                initialSelectedPaths: props.selectedPath
                    ? [props.selectedPath]
                    : undefined,
                initialVisibleRowCount: Math.max(paths.length, 1),
                onSelectionChange: (selectedPaths) => {
                    const selectedPath = selectedPaths.at(-1);
                    if (!selectedPath || selectedPath === props.selectedPath)
                        return;

                    const item = displayPathToItem().get(selectedPath);
                    if (!item || item.type === "dir") return;

                    navigate(
                        itemHref(
                            props.repoUrl,
                            props.tree,
                            absoluteItemPath(props.pathPrefix, item.path),
                        ),
                    );
                },
                paths,
            });

            fileTree.render({ containerWrapper: container });
            fileTree.subscribe(() => {
                writeExpandedPaths(props.stateKey, container);
            });
        }

        if (lastPathsKey !== pathsKey) {
            fileTree.resetPaths(paths);
            lastPathsKey = pathsKey;
        }

        if (props.selectedPath) {
            fileTree.getItem(props.selectedPath)?.select();
            fileTree.getItem(props.selectedPath)?.focus();
        }
    });

    onCleanup(() => {
        fileTree?.cleanUp();
    });

    return (
        <div class={`rounded-md border border-base-300 bg-base-100 ${props.class ?? ""}`}>
            <Show when={props.showHeader ?? true}>
                <div class="border-b border-base-300 p-4">
                    <CommitListItem
                        commit={props.latestCommit}
                        historyLabel={headerHistoryLabel()}
                        historyHref={props.historyHref}
                    />
                </div>
            </Show>
            <div ref={container} class="w-full" />
        </div>
    );
}

export default FileList;
