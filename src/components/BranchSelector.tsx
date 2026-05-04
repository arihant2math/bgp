import { Button, Label, Spinner, TextInput } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { useQuery } from "@tanstack/solid-query";
import {
    createEffect,
    createMemo,
    createSignal,
    For,
    onCleanup,
    onMount,
    Show,
} from "solid-js";
import { repoHref, repoTreeHref } from "../lib/hrefGen.ts";
import {
    fetchRepositoryRefs,
    type RepositoryBranch,
    type RepositoryTag,
} from "../lib/githubRefs.ts";

type BranchSelectorProps = {
    profile: string;
    repo: string;
    currentRef: string;
    defaultBranch?: string | null;
    path?: string[];
    compact?: boolean;
    showCounts?: boolean;
};

type RefTab = "branches" | "tags";

type RefListItem =
    | ({ type: "branch" } & RepositoryBranch)
    | ({ type: "tag" } & RepositoryTag);

function pluralize(count: number, singular: string, plural: string) {
    return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

function BranchSelector(props: BranchSelectorProps) {
    const [isOpen, setIsOpen] = createSignal(false);
    const [tab, setTab] = createSignal<RefTab>("branches");
    const [search, setSearch] = createSignal("");
    let containerRef: HTMLDivElement | undefined;
    let searchInputRef: HTMLInputElement | undefined;

    const refsQuery = useQuery(() => ({
        queryKey: ["repoRefs", props.profile, props.repo],
        queryFn: () =>
            fetchRepositoryRefs({
                owner: props.profile,
                repo: props.repo,
            }),
        enabled: props.showCounts || isOpen(),
    }));

    const sortedBranches = createMemo(() => {
        const branches = [...(refsQuery.data?.branches ?? [])];

        return branches.sort((a, b) => {
            if (a.name === props.currentRef) return -1;
            if (b.name === props.currentRef) return 1;
            if (a.name === props.defaultBranch) return -1;
            if (b.name === props.defaultBranch) return 1;
            return a.name.localeCompare(b.name);
        });
    });

    const sortedTags = createMemo(() => {
        const tags = [...(refsQuery.data?.tags ?? [])];

        return tags.sort((a, b) => {
            if (a.name === props.currentRef) return -1;
            if (b.name === props.currentRef) return 1;
            return a.name.localeCompare(b.name);
        });
    });

    const visibleItems = createMemo<RefListItem[]>(() => {
        const items =
            tab() === "branches"
                ? sortedBranches().map((branch) => ({
                      ...branch,
                      type: "branch" as const,
                  }))
                : sortedTags().map((tag) => ({
                      ...tag,
                      type: "tag" as const,
                  }));
        const searchTerm = search().trim().toLowerCase();

        if (!searchTerm) return items;

        return items.filter((item) =>
            item.name.toLowerCase().includes(searchTerm),
        );
    });

    const counts = createMemo(() => ({
        branches: refsQuery.data?.branches.length ?? 0,
        tags: refsQuery.data?.tags.length ?? 0,
    }));

    const openSelector = () => {
        setSearch("");

        const currentIsTag = refsQuery.data?.tags.some(
            (tag) => tag.name === props.currentRef,
        );
        setTab(currentIsTag ? "tags" : "branches");
        setIsOpen(true);
    };

    const closeSelector = () => setIsOpen(false);

    const hrefForRef = (ref: string) => {
        const path = props.path ?? [];

        if (path.length === 0 && ref === props.defaultBranch) {
            return repoHref(props.profile, props.repo);
        }

        return repoTreeHref(props.profile, props.repo, ref, path);
    };

    createEffect(() => {
        if (!isOpen()) return;

        requestAnimationFrame(() => searchInputRef?.focus());
    });

    createEffect(() => {
        if (!isOpen() || !refsQuery.data) return;
        if (tab() === "tags") return;

        const currentIsTag = refsQuery.data.tags.some(
            (tag) => tag.name === props.currentRef,
        );

        if (currentIsTag) setTab("tags");
    });

    const handlePointerDown = (event: PointerEvent) => {
        if (!isOpen()) return;
        if (containerRef?.contains(event.target as Node)) return;
        closeSelector();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") closeSelector();
    };

    onMount(() => {
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        onCleanup(() => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        });
    });

    return (
        <div ref={containerRef} class="relative">
            <div
                class={
                    props.showCounts
                        ? "flex flex-wrap items-center gap-3"
                        : "flex items-center"
                }
            >
                <Button
                    size={props.compact ? "small" : "medium"}
                    onClick={() => (isOpen() ? closeSelector() : openSelector())}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen()}
                    leadingVisual={
                        <Octicon
                            name="git-branch"
                            size={16}
                            aria-hidden="true"
                        />
                    }
                    trailingVisual={
                        <Octicon
                            name="chevron-down"
                            size={16}
                            aria-hidden="true"
                        />
                    }
                    class={
                        props.compact
                            ? "min-w-[9.5rem] justify-between"
                            : "min-w-[11rem] justify-between"
                    }
                >
                    <span class="truncate">{props.currentRef}</span>
                </Button>
                <Show when={props.showCounts}>
                    <div class="flex flex-wrap items-center gap-4 text-sm text-[var(--fgColor-muted)]">
                        <Show
                            when={refsQuery.isPending}
                            fallback={
                                <>
                                    <div class="flex items-center gap-2">
                                        <Octicon
                                            name="git-branch"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        <span>
                                            <span class="font-semibold text-[var(--fgColor-default)]">
                                                {counts().branches.toLocaleString()}
                                            </span>{" "}
                                            Branches
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Octicon
                                            name="tag"
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        <span>
                                            <span class="font-semibold text-[var(--fgColor-default)]">
                                                {counts().tags.toLocaleString()}
                                            </span>{" "}
                                            Tags
                                        </span>
                                    </div>
                                </>
                            }
                        >
                            <div class="flex items-center gap-2 text-[var(--fgColor-muted)]">
                                <Spinner
                                    size="small"
                                    srText={null}
                                    aria-hidden="true"
                                />
                                Loading refs…
                            </div>
                        </Show>
                    </div>
                </Show>
            </div>
            <Show when={isOpen()}>
                <div
                    role="dialog"
                    aria-label="Switch branches or tags"
                    class="absolute left-0 top-full z-20 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] shadow-lg"
                >
                    <div class="flex items-center justify-between border-b border-[var(--borderColor-muted)] px-4 py-3">
                        <h2 class="text-lg font-semibold text-[var(--fgColor-default)]">
                            Switch branches/tags
                        </h2>
                        <Button
                            variant="invisible"
                            onClick={closeSelector}
                            aria-label="Close branch selector"
                            leadingVisual={
                                <Octicon
                                    name="x"
                                    size={16}
                                    aria-hidden="true"
                                />
                            }
                        />
                    </div>
                    <div class="border-b border-[var(--borderColor-muted)] p-3">
                        <TextInput
                            ref={(element) => {
                                searchInputRef = element;
                            }}
                            block
                            value={search()}
                            onInput={(event) =>
                                setSearch(event.currentTarget.value)
                            }
                            placeholder={
                                tab() === "branches"
                                    ? "Find a branch..."
                                    : "Find a tag..."
                            }
                            leadingVisual={
                                <Octicon
                                    name="search"
                                    size={16}
                                    aria-hidden="true"
                                />
                            }
                        />
                    </div>
                    <div class="flex border-b border-[var(--borderColor-muted)]">
                        <button
                            type="button"
                            onClick={() => setTab("branches")}
                            class={
                                tab() === "branches"
                                    ? "border-b-2 border-[var(--borderColor-accent-emphasis)] px-4 py-3 text-sm font-semibold text-[var(--fgColor-default)]"
                                    : "border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]"
                            }
                        >
                            Branches
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("tags")}
                            class={
                                tab() === "tags"
                                    ? "border-b-2 border-[var(--borderColor-accent-emphasis)] px-4 py-3 text-sm font-semibold text-[var(--fgColor-default)]"
                                    : "border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]"
                            }
                        >
                            Tags
                        </button>
                    </div>
                    <div class="max-h-[26rem] overflow-auto py-2">
                        <Show
                            when={refsQuery.isPending}
                            fallback={
                                <Show
                                    when={!refsQuery.isError}
                                    fallback={
                                        <div class="px-4 py-6 text-sm text-[var(--fgColor-muted)]">
                                            Unable to load branches and tags.
                                        </div>
                                    }
                                >
                                    <Show
                                        when={visibleItems().length > 0}
                                        fallback={
                                            <div class="px-4 py-6 text-sm text-[var(--fgColor-muted)]">
                                                {`No ${tab()} found.`}
                                            </div>
                                        }
                                    >
                                        <For each={visibleItems()}>
                                            {(item) => (
                                                <a
                                                    href={hrefForRef(item.name)}
                                                    onClick={() =>
                                                        closeSelector()
                                                    }
                                                    class="flex items-center gap-3 px-4 py-2 text-sm text-[var(--fgColor-default)] hover:bg-[var(--control-transparent-bgColor-hover)]"
                                                >
                                                    <span class="flex w-4 justify-center text-[var(--fgColor-accent)]">
                                                        <Show
                                                            when={
                                                                item.name ===
                                                                props.currentRef
                                                            }
                                                        >
                                                            <Octicon
                                                                name="check"
                                                                size={16}
                                                                aria-hidden="true"
                                                            />
                                                        </Show>
                                                    </span>
                                                    <span class="min-w-0 flex-1 truncate">
                                                        {item.name}
                                                    </span>
                                                    <Show
                                                        when={
                                                            item.type ===
                                                                "branch" &&
                                                            item.name ===
                                                                props.defaultBranch
                                                        }
                                                    >
                                                        <Label
                                                            variant="secondary"
                                                            size="small"
                                                        >
                                                            default
                                                        </Label>
                                                    </Show>
                                                </a>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            }
                        >
                            <div class="flex items-center gap-3 px-4 py-6 text-sm text-[var(--fgColor-muted)]">
                                <Spinner
                                    size="small"
                                    srText={null}
                                    aria-hidden="true"
                                />
                                {pluralize(
                                    tab() === "branches"
                                        ? counts().branches
                                        : counts().tags,
                                    tab() === "branches" ? "branch" : "tag",
                                    tab() === "branches"
                                        ? "branches"
                                        : "tags",
                                )}
                                loading…
                            </div>
                        </Show>
                    </div>
                </div>
            </Show>
        </div>
    );
}

export default BranchSelector;
