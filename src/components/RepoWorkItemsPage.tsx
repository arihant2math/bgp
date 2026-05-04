import {
    ActionList,
    Button,
    ButtonBase,
    CounterLabel,
    Flash,
    IssueLabel,
    Label,
    Pagination,
    Spinner,
    TextInput,
} from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { useSearchParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import {
    For,
    Match,
    Show,
    Switch,
    createEffect,
    createMemo,
    createSignal,
    type JSX,
} from "solid-js";
import type {
    IssueReasonFilter,
    PullDraftFilter,
    PullReviewFilter,
    WorkItem,
    WorkItemFilters,
    WorkItemKind,
    WorkItemLabel,
    WorkItemMilestone,
    WorkItemSort,
    WorkItemState,
    WorkItemUser,
} from "../lib/githubWorkItems.ts";
import {
    SEARCH_RESULT_LIMIT,
    WORK_ITEMS_PER_PAGE,
    defaultWorkItemFilters,
    fetchRepoAssignees,
    fetchRepoLabels,
    fetchRepoMilestones,
    fetchWorkItems,
    normalizeWorkItemFilters,
    workItemFiltersToSearchParams,
} from "../lib/githubWorkItems.ts";
import { repoHref } from "../lib/hrefGen.ts";
import Avatar from "./Avatar.tsx";
import RelativeDate from "./RelativeDate.tsx";
import RepoPageLayout from "./RepoPageLayout.tsx";

export type RepoWorkItemsPageProps = {
    profile: string;
    repo: string;
    kind: WorkItemKind;
};

type SearchParamShape = Partial<Record<keyof WorkItemFilters, string>>;

type FilterChip = {
    label: string;
    href: string;
};

type MenuAlignment = "left" | "right";

const SORT_OPTIONS: Array<{ value: WorkItemSort; label: string }> = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "recently-updated", label: "Recently updated" },
    { value: "least-recently-updated", label: "Least recently updated" },
    { value: "most-commented", label: "Most commented" },
    { value: "least-commented", label: "Least commented" },
    { value: "most-reacted", label: "Most reacted" },
    { value: "relevance", label: "Best match" },
];

const DRAFT_OPTIONS: Array<{ value: PullDraftFilter; label: string }> = [
    { value: "all", label: "Drafts and ready" },
    { value: "ready", label: "Ready for review" },
    { value: "draft", label: "Draft only" },
];

const REVIEW_OPTIONS: Array<{ value: PullReviewFilter; label: string }> = [
    { value: "all", label: "Any review state" },
    { value: "required", label: "Review required" },
    { value: "approved", label: "Approved" },
    { value: "changes-requested", label: "Changes requested" },
];

const REASON_OPTIONS: Array<{ value: IssueReasonFilter; label: string }> = [
    { value: "all", label: "Any close reason" },
    { value: "completed", label: "Completed" },
    { value: "not-planned", label: "Not planned" },
];

function pagePath(kind: WorkItemKind) {
    return kind === "issues" ? "/issues" : "/pulls";
}

function pageTitle(kind: WorkItemKind) {
    return kind === "issues" ? "Issues" : "Pull requests";
}

function itemNoun(kind: WorkItemKind, count = 2) {
    if (kind === "issues") return count === 1 ? "issue" : "issues";
    return count === 1 ? "pull request" : "pull requests";
}

function filterHref(props: RepoWorkItemsPageProps, filters: WorkItemFilters) {
    const params = new URLSearchParams();
    const serialized = workItemFiltersToSearchParams(filters);

    for (const [key, value] of Object.entries(serialized)) {
        if (value !== undefined) params.set(key, value);
    }

    const query = params.toString();
    const base = repoHref(props.profile, props.repo, pagePath(props.kind));
    return query ? `${base}?${query}` : base;
}

function withFilter(
    props: RepoWorkItemsPageProps,
    filters: WorkItemFilters,
    patch: Partial<WorkItemFilters>,
) {
    return filterHref(props, { ...filters, ...patch, page: 1 });
}

function pageHref(
    props: RepoWorkItemsPageProps,
    filters: WorkItemFilters,
    page: number,
) {
    return filterHref(props, { ...filters, page });
}

function formatCount(count: number) {
    return new Intl.NumberFormat().format(count);
}

function getErrorMessage(error: unknown) {
    const candidate = error as { message?: string; status?: number };
    const prefix = candidate.status
        ? `GitHub returned ${candidate.status}. `
        : "";
    return `${prefix}${candidate.message ?? "Something went wrong."}`;
}

function labelBackground(
    hex: string | null | undefined,
): `#${string}` | undefined {
    return hex && /^[0-9a-f]{6}$/i.test(hex)
        ? (`#${hex}` as `#${string}`)
        : undefined;
}

function itemIcon(item: WorkItem, kind: WorkItemKind) {
    if (kind === "pulls") {
        if (item.draft) {
            return {
                name: "git-pull-request-draft" as const,
                class: "text-[var(--fgColor-muted)]",
            };
        }
        if (item.state === "open") {
            return {
                name: "git-pull-request" as const,
                class: "text-[var(--fgColor-success)]",
            };
        }
        if (item.pull_request?.merged_at) {
            return {
                name: "git-merge" as const,
                class: "text-[var(--fgColor-done)]",
            };
        }
        return {
            name: "git-pull-request-closed" as const,
            class: "text-[var(--fgColor-danger)]",
        };
    }

    if (item.state === "open") {
        return {
            name: "issue-opened" as const,
            class: "text-[var(--fgColor-success)]",
        };
    }
    if (item.state_reason === "not_planned") {
        return { name: "skip" as const, class: "text-[var(--fgColor-danger)]" };
    }
    return {
        name: "issue-closed" as const,
        class: "text-[var(--fgColor-done)]",
    };
}

function closeDetailsMenu(target: EventTarget | null | undefined) {
    if (!(target instanceof Element)) return;
    const details = target.closest("details");
    if (details instanceof HTMLDetailsElement) details.open = false;
}

function toggleArrayValue(values: string[], value: string) {
    return values.includes(value)
        ? values.filter((entry) => entry !== value)
        : [...values, value];
}

function menuButtonClass(active: boolean) {
    return [
        "list-none rounded-md px-3 py-2 text-sm font-semibold transition-colors [&::-webkit-details-marker]:hidden",
        active
            ? "bg-[var(--buttonDefault-bgColor-hover)] text-[var(--fgColor-default)]"
            : "text-[var(--fgColor-muted)] hover:bg-[var(--buttonDefault-bgColor-hover)] hover:text-[var(--fgColor-default)]",
    ].join(" ");
}

function menuPanelClass(widthClass: string, align: MenuAlignment) {
    return [
        "absolute top-full z-30 mt-2 overflow-hidden rounded-xl border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] shadow-[0_16px_48px_rgba(1,4,9,0.18)]",
        widthClass,
        align === "right" ? "right-0" : "left-0",
    ].join(" ");
}

function menuSearchMatches(value: string, query: string) {
    return value.toLowerCase().includes(query.trim().toLowerCase());
}

function qualifierStateLabel(state: WorkItemState) {
    if (state === "all") return null;
    return `state:${state}`;
}

function sortLabel(value: WorkItemSort) {
    return (
        SORT_OPTIONS.find((option) => option.value === value)?.label ?? "Newest"
    );
}

function reasonLabel(value: IssueReasonFilter) {
    return (
        REASON_OPTIONS.find((option) => option.value === value)?.label ??
        "Types"
    );
}

function reviewLabel(value: PullReviewFilter) {
    return (
        REVIEW_OPTIONS.find((option) => option.value === value)?.label ??
        "Review"
    );
}

function draftLabel(value: PullDraftFilter) {
    return (
        DRAFT_OPTIONS.find((option) => option.value === value)?.label ?? "Draft"
    );
}

function currentTypesLabel(kind: WorkItemKind, filters: WorkItemFilters) {
    if (kind === "issues") {
        return filters.reason === "all" ? "Types" : reasonLabel(filters.reason);
    }
    if (filters.draft !== "all") return draftLabel(filters.draft);
    if (filters.review !== "all") return reviewLabel(filters.review);
    return "Types";
}

function WorkItemLabelBadge(props: { label: WorkItemLabel }) {
    const background = () => labelBackground(props.label.color);

    return (
        <IssueLabel
            fillColor={background()}
            title={props.label.description ?? props.label.name}
        >
            {props.label.name}
        </IssueLabel>
    );
}

function AssigneeAvatar(props: { assignee: WorkItemUser; size?: number }) {
    const size = () => props.size ?? 24;

    return (
        <div title={props.assignee.login}>
            <Show
                when={props.assignee.avatar_url}
                fallback={
                    <div
                        class="grid place-items-center rounded-full border border-[var(--borderColor-default)] bg-[var(--bgColor-muted)]"
                        style={{ width: `${size()}px`, height: `${size()}px` }}
                    >
                        <Octicon name="person" size={12} aria-hidden="true" />
                    </div>
                }
            >
                {(avatarUrl) => (
                    <Avatar
                        href={avatarUrl()}
                        size={size()}
                        alt={`${props.assignee.login}'s avatar`}
                    />
                )}
            </Show>
        </div>
    );
}

function MenuPanel(props: {
    heading: string;
    widthClass?: string;
    align?: MenuAlignment;
    children: JSX.Element;
}) {
    return (
        <div
            class={menuPanelClass(
                props.widthClass ?? "w-[22rem]",
                props.align ?? "left",
            )}
        >
            <div class="border-b border-[var(--borderColor-default)] px-4 py-3">
                <div class="text-[15px] font-semibold text-[var(--fgColor-default)]">
                    {props.heading}
                </div>
            </div>
            <div>{props.children}</div>
        </div>
    );
}

function ToolbarMenu(props: {
    label: string;
    active?: boolean;
    align?: MenuAlignment;
    leadingVisual?: JSX.Element;
    widthClass?: string;
    children: JSX.Element;
}) {
    return (
        <details class="relative">
            <ButtonBase
                as="summary"
                variant="invisible"
                size="small"
                class={menuButtonClass(Boolean(props.active))}
                leadingVisual={props.leadingVisual}
                trailingVisual={
                    <Octicon
                        name="triangle-down"
                        size={12}
                        aria-hidden="true"
                    />
                }
            >
                {props.label}
            </ButtonBase>
            <div class="contents">{props.children}</div>
        </details>
    );
}

function EmptyMenuState(props: { message: string }) {
    return (
        <div class="px-4 py-5 text-sm text-[var(--fgColor-muted)]">
            {props.message}
        </div>
    );
}

function MenuSearchInput(props: {
    placeholder: string;
    value: string;
    onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>;
}) {
    return (
        <div class="border-b border-[var(--borderColor-default)] px-3 py-3">
            <TextInput
                block
                value={props.value}
                onInput={props.onInput}
                placeholder={props.placeholder}
                leadingVisual={
                    <Octicon name="search" size={16} aria-hidden="true" />
                }
                autocomplete="off"
            />
        </div>
    );
}

function WorkItemRow(props: { item: WorkItem; kind: WorkItemKind }) {
    const icon = () => itemIcon(props.item, props.kind);
    const assignees = createMemo(() => props.item.assignees ?? []);

    return (
        <li class="border-b border-[var(--borderColor-muted)] px-6 py-5 last:border-b-0 hover:bg-[var(--bgColor-muted)]">
            <div class="flex items-start gap-4">
                <div class="pt-1">
                    <Octicon
                        name={icon().name}
                        size={18}
                        class={icon().class}
                        aria-hidden="true"
                    />
                </div>

                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <a
                            href={props.item.html_url}
                            target="_blank"
                            rel="noreferrer"
                            class="min-w-0 text-[1.1rem] font-semibold leading-6 text-[var(--fgColor-default)] hover:text-[var(--fgColor-accent)] hover:underline"
                        >
                            {props.item.title || "Untitled"}
                        </a>
                        <Show when={props.item.locked}>
                            <Label
                                variant="attention"
                                size="small"
                                class="inline-flex items-center gap-1"
                            >
                                <Octicon
                                    name="lock"
                                    size={12}
                                    aria-hidden="true"
                                />
                                Locked
                            </Label>
                        </Show>
                        <For each={props.item.labels}>
                            {(label) => <WorkItemLabelBadge label={label} />}
                        </For>
                    </div>

                    <div class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] text-[var(--fgColor-muted)]">
                        <span>#{props.item.number}</span>
                        <span aria-hidden="true">·</span>
                        <Show when={props.item.user?.login}>
                            {(login) => (
                                <>
                                    <a
                                        href={
                                            props.item.user?.html_url ??
                                            undefined
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        class="font-medium text-[var(--fgColor-muted)] hover:text-[var(--fgColor-accent)] hover:underline"
                                    >
                                        {login()}
                                    </a>
                                    <span>opened</span>
                                </>
                            )}
                        </Show>
                        <RelativeDate datetime={props.item.created_at} />
                        <Show when={props.item.milestone?.title}>
                            {(title) => (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span class="inline-flex items-center gap-1">
                                        <Octicon
                                            name="milestone"
                                            size={13}
                                            aria-hidden="true"
                                        />
                                        {title()}
                                    </span>
                                </>
                            )}
                        </Show>
                    </div>
                </div>

                <div class="hidden min-w-28 shrink-0 items-center justify-end gap-4 pt-1 text-sm text-[var(--fgColor-muted)] md:flex">
                    <Show when={assignees().length > 0}>
                        <div class="flex items-center -space-x-2">
                            <For each={assignees().slice(0, 3)}>
                                {(assignee) => (
                                    <div class="rounded-full ring-2 ring-[var(--bgColor-default)]">
                                        <AssigneeAvatar assignee={assignee} />
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                    <Show when={props.item.comments > 0}>
                        <div
                            class="inline-flex items-center gap-1"
                            title={`${props.item.comments} comments`}
                        >
                            <Octicon
                                name="comment"
                                size={16}
                                aria-hidden="true"
                            />
                            {formatCount(props.item.comments)}
                        </div>
                    </Show>
                </div>
            </div>
        </li>
    );
}

function ActiveFilters(props: { chips: FilterChip[]; clearHref: string }) {
    return (
        <Show when={props.chips.length > 0}>
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-[var(--fgColor-muted)]">Filters</span>
                <For each={props.chips}>
                    {(chip) => (
                        <Label
                            as="a"
                            href={chip.href}
                            variant="default"
                            class="inline-flex items-center gap-1 rounded-full no-underline hover:opacity-80"
                        >
                            {chip.label}
                            <Octicon name="x" size={12} aria-hidden="true" />
                        </Label>
                    )}
                </For>
                <Button
                    as="a"
                    href={props.clearHref}
                    size="small"
                    variant="invisible"
                >
                    Clear all
                </Button>
            </div>
        </Show>
    );
}

function CountPill(props: { count?: number; pending: boolean }) {
    return (
        <Show
            when={!props.pending}
            fallback={
                <span class="inline-flex min-h-5 min-w-5 items-center justify-center">
                    <Spinner size="small" srText={null} aria-hidden="true" />
                </span>
            }
        >
            <CounterLabel variant="secondary">
                {formatCount(props.count ?? 0)}
            </CounterLabel>
        </Show>
    );
}

function WorkItemsSearchControls(props: {
    pageProps: RepoWorkItemsPageProps;
    filters: WorkItemFilters;
    searchText: string;
    onSearchInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>;
    onSearchSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent>;
}) {
    const qualifier = () =>
        props.pageProps.kind === "issues" ? "is:issue" : "is:pr";
    const stateQualifier = () => qualifierStateLabel(props.filters.state);
    const githubBase = () =>
        `https://github.com/${encodeURIComponent(props.pageProps.profile)}/${encodeURIComponent(props.pageProps.repo)}`;
    const newHref = () =>
        props.pageProps.kind === "issues"
            ? `${githubBase()}/issues/new`
            : `${githubBase()}/compare`;

    return (
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
            <form onSubmit={props.onSearchSubmit} class="flex min-w-0 flex-1">
                <div class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] shadow-sm">
                    <div class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                        <Label variant="accent" size="small">
                            {qualifier()}
                        </Label>
                        <Show when={stateQualifier()}>
                            {(state) => (
                                <Label variant="accent" size="small">
                                    {state()}
                                </Label>
                            )}
                        </Show>
                        <input
                            type="search"
                            value={props.searchText}
                            onInput={props.onSearchInput}
                            placeholder={`Search ${itemNoun(props.pageProps.kind)}`}
                            autocomplete="off"
                            class="min-w-24 grow border-0 bg-transparent text-sm text-[var(--fgColor-default)] outline-none placeholder:text-[var(--fgColor-muted)]"
                        />
                    </div>
                    <Button
                        type="submit"
                        aria-label={`Search ${itemNoun(props.pageProps.kind)}`}
                        icon={
                            <Octicon
                                name="search"
                                size={18}
                                aria-hidden="true"
                            />
                        }
                        class="rounded-none border-0 border-l border-solid border-l-[var(--borderColor-default)]"
                    />
                </div>
            </form>

            <div class="flex flex-wrap gap-2">
                <Button
                    as="a"
                    href={`${githubBase()}/labels`}
                    target="_blank"
                    rel="noreferrer"
                    leadingVisual={
                        <Octicon name="tag" size={16} aria-hidden="true" />
                    }
                >
                    Labels
                </Button>
                <Button
                    as="a"
                    href={`${githubBase()}/milestones`}
                    target="_blank"
                    rel="noreferrer"
                    leadingVisual={
                        <Octicon
                            name="milestone"
                            size={16}
                            aria-hidden="true"
                        />
                    }
                >
                    Milestones
                </Button>
                <Button
                    as="a"
                    href={newHref()}
                    target="_blank"
                    rel="noreferrer"
                    variant="primary"
                >
                    {props.pageProps.kind === "issues"
                        ? "New issue"
                        : "New pull request"}
                </Button>
            </div>
        </div>
    );
}

function WorkItemsToolbar(props: {
    pageProps: RepoWorkItemsPageProps;
    filters: WorkItemFilters;
    openHref: string;
    closedHref: string;
    openCount?: number;
    closedCount?: number;
    openPending: boolean;
    closedPending: boolean;
    authorOptions: WorkItemUser[];
    labelOptions: WorkItemLabel[];
    assigneeOptions: WorkItemUser[];
    milestoneOptions: WorkItemMilestone[];
    labelOptionsPending: boolean;
    assigneeOptionsPending: boolean;
    milestoneOptionsPending: boolean;
    labelOptionsError: boolean;
    assigneeOptionsError: boolean;
    milestoneOptionsError: boolean;
    onPatchFilters: (patch: Partial<WorkItemFilters>) => void;
    clearHref: string;
}) {
    const [authorQuery, setAuthorQuery] = createSignal("");
    const [labelQuery, setLabelQuery] = createSignal("");
    const [assigneeQuery, setAssigneeQuery] = createSignal("");
    const [milestoneQuery, setMilestoneQuery] = createSignal("");

    const visibleAuthors = createMemo(() => {
        const seen = new Set<string>();
        const selected = props.filters.author
            ? [{ login: props.filters.author } satisfies WorkItemUser]
            : [];
        return [...selected, ...props.authorOptions]
            .filter((user) => {
                if (seen.has(user.login)) return false;
                seen.add(user.login);
                return menuSearchMatches(user.login, authorQuery());
            })
            .sort((a, b) => a.login.localeCompare(b.login));
    });

    const visibleLabels = createMemo(() =>
        props.labelOptions.filter(
            (label) =>
                menuSearchMatches(label.name, labelQuery()) ||
                menuSearchMatches(label.description ?? "", labelQuery()),
        ),
    );

    const visibleAssignees = createMemo(() => {
        const selected = props.filters.assignee
            ? [{ login: props.filters.assignee } satisfies WorkItemUser]
            : [];
        const seen = new Set<string>();
        return [...selected, ...props.assigneeOptions]
            .filter((user) => {
                if (seen.has(user.login)) return false;
                seen.add(user.login);
                return menuSearchMatches(user.login, assigneeQuery());
            })
            .sort((a, b) => a.login.localeCompare(b.login));
    });

    const visibleMilestones = createMemo(() => {
        const selected = props.filters.milestone
            ? [
                  {
                      title: props.filters.milestone,
                      state: undefined,
                  } satisfies WorkItemMilestone,
              ]
            : [];
        const seen = new Set<string>();
        return [...selected, ...props.milestoneOptions]
            .filter((milestone) => {
                if (seen.has(milestone.title)) return false;
                seen.add(milestone.title);
                return menuSearchMatches(milestone.title, milestoneQuery());
            })
            .sort((a, b) => a.title.localeCompare(b.title));
    });

    const activeStateClass = (state: WorkItemState) =>
        props.filters.state === state
            ? "font-semibold text-[var(--fgColor-default)]"
            : "font-medium text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]";

    const hasLabelFilters = () =>
        props.filters.labels.length > 0 || props.filters.noLabels;
    const hasMilestoneFilter = () =>
        props.filters.milestone.length > 0 || props.filters.noMilestone;
    const hasAssigneeFilter = () =>
        props.filters.assignee.length > 0 || props.filters.unassigned;
    const hasTypesFilter = () =>
        props.pageProps.kind === "issues"
            ? props.filters.reason !== "all"
            : props.filters.draft !== "all" || props.filters.review !== "all";

    return (
        <div class="border-b border-[var(--borderColor-default)] bg-[var(--bgColor-muted)] px-4 py-3 lg:px-5">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
                    <a
                        href={props.openHref}
                        class={`inline-flex items-center gap-2 ${activeStateClass("open")}`}
                    >
                        <span>Open</span>
                        <CountPill
                            count={props.openCount}
                            pending={props.openPending}
                        />
                    </a>
                    <a
                        href={props.closedHref}
                        class={`inline-flex items-center gap-2 ${activeStateClass("closed")}`}
                    >
                        <span>Closed</span>
                        <CountPill
                            count={props.closedCount}
                            pending={props.closedPending}
                        />
                    </a>
                </div>

                <div class="flex flex-wrap items-center gap-1">
                    <ToolbarMenu
                        label={props.filters.author || "Author"}
                        active={Boolean(props.filters.author)}
                    >
                        <MenuPanel heading="Filter by author">
                            <MenuSearchInput
                                placeholder="Filter authors"
                                value={authorQuery()}
                                onInput={(event) =>
                                    setAuthorQuery(event.currentTarget.value)
                                }
                            />
                            <div class="max-h-[24rem] overflow-y-auto">
                                <Show when={props.filters.author}>
                                    <ActionList>
                                        <ActionList.Item
                                            onSelect={(event) => {
                                                props.onPatchFilters({
                                                    author: "",
                                                });
                                                closeDetailsMenu(
                                                    event.currentTarget,
                                                );
                                            }}
                                        >
                                            Clear author filter
                                        </ActionList.Item>
                                    </ActionList>
                                </Show>
                                <Show
                                    when={visibleAuthors().length > 0}
                                    fallback={
                                        <EmptyMenuState message="No matching authors." />
                                    }
                                >
                                    <ActionList>
                                        <For each={visibleAuthors()}>
                                            {(user) => (
                                                <ActionList.Item
                                                    active={
                                                        props.filters.author ===
                                                        user.login
                                                    }
                                                    onSelect={(event) => {
                                                        props.onPatchFilters({
                                                            author: user.login,
                                                        });
                                                        closeDetailsMenu(
                                                            event.currentTarget,
                                                        );
                                                    }}
                                                >
                                                    <ActionList.LeadingVisual>
                                                        <AssigneeAvatar
                                                            assignee={user}
                                                            size={20}
                                                        />
                                                    </ActionList.LeadingVisual>
                                                    {user.login}
                                                </ActionList.Item>
                                            )}
                                        </For>
                                    </ActionList>
                                </Show>
                            </div>
                        </MenuPanel>
                    </ToolbarMenu>

                    <ToolbarMenu label="Labels" active={hasLabelFilters()}>
                        <MenuPanel
                            heading="Filter by label"
                            widthClass="w-[31rem]"
                        >
                            <MenuSearchInput
                                placeholder="Filter labels"
                                value={labelQuery()}
                                onInput={(event) =>
                                    setLabelQuery(event.currentTarget.value)
                                }
                            />
                            <div class="max-h-[34rem] overflow-y-auto">
                                <Show
                                    when={!props.labelOptionsPending}
                                    fallback={
                                        <div class="grid place-items-center px-4 py-8">
                                            <Spinner size="large" />
                                        </div>
                                    }
                                >
                                    <Show
                                        when={!props.labelOptionsError}
                                        fallback={
                                            <EmptyMenuState message="Unable to load labels." />
                                        }
                                    >
                                        <ActionList>
                                            <ActionList.Item
                                                active={props.filters.noLabels}
                                                onSelect={() => {
                                                    props.onPatchFilters({
                                                        noLabels:
                                                            !props.filters
                                                                .noLabels,
                                                        labels: [],
                                                    });
                                                }}
                                            >
                                                <ActionList.LeadingVisual>
                                                    <span class="grid size-4 place-items-center rounded-sm border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] text-[10px]">
                                                        <Show
                                                            when={
                                                                props.filters
                                                                    .noLabels
                                                            }
                                                        >
                                                            <Octicon
                                                                name="check"
                                                                size={12}
                                                                aria-hidden="true"
                                                            />
                                                        </Show>
                                                    </span>
                                                </ActionList.LeadingVisual>
                                                No labels
                                            </ActionList.Item>
                                            <For each={visibleLabels()}>
                                                {(label) => {
                                                    const selected = () =>
                                                        props.filters.labels.includes(
                                                            label.name,
                                                        );
                                                    return (
                                                        <ActionList.Item
                                                            active={selected()}
                                                            onSelect={() => {
                                                                props.onPatchFilters(
                                                                    {
                                                                        noLabels: false,
                                                                        labels: toggleArrayValue(
                                                                            props
                                                                                .filters
                                                                                .labels,
                                                                            label.name,
                                                                        ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <ActionList.LeadingVisual>
                                                                <div class="flex items-center gap-2">
                                                                    <span class="grid size-4 place-items-center rounded-sm border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] text-[10px]">
                                                                        <Show
                                                                            when={selected()}
                                                                        >
                                                                            <Octicon
                                                                                name="check"
                                                                                size={
                                                                                    12
                                                                                }
                                                                                aria-hidden="true"
                                                                            />
                                                                        </Show>
                                                                    </span>
                                                                    <span
                                                                        class="size-3 rounded-full border border-black/10"
                                                                        style={{
                                                                            "background-color":
                                                                                labelBackground(
                                                                                    label.color,
                                                                                ) ??
                                                                                "var(--fgColor-muted)",
                                                                        }}
                                                                    />
                                                                </div>
                                                            </ActionList.LeadingVisual>
                                                            {label.name}
                                                            <Show
                                                                when={
                                                                    label.description
                                                                }
                                                            >
                                                                {(
                                                                    description,
                                                                ) => (
                                                                    <ActionList.Description variant="block">
                                                                        {description()}
                                                                    </ActionList.Description>
                                                                )}
                                                            </Show>
                                                        </ActionList.Item>
                                                    );
                                                }}
                                            </For>
                                        </ActionList>
                                    </Show>
                                </Show>
                            </div>
                        </MenuPanel>
                    </ToolbarMenu>

                    <ToolbarMenu label="Projects">
                        <MenuPanel heading="Projects" widthClass="w-[24rem]">
                            <EmptyMenuState message="GitHub issue search does not expose project filters here yet." />
                        </MenuPanel>
                    </ToolbarMenu>

                    <ToolbarMenu
                        label={
                            props.filters.milestone ||
                            (props.filters.noMilestone
                                ? "No milestone"
                                : "Milestones")
                        }
                        active={hasMilestoneFilter()}
                    >
                        <MenuPanel
                            heading="Filter by milestone"
                            widthClass="w-[26rem]"
                        >
                            <MenuSearchInput
                                placeholder="Filter milestones"
                                value={milestoneQuery()}
                                onInput={(event) =>
                                    setMilestoneQuery(event.currentTarget.value)
                                }
                            />
                            <div class="max-h-[28rem] overflow-y-auto">
                                <Show
                                    when={!props.milestoneOptionsPending}
                                    fallback={
                                        <div class="grid place-items-center px-4 py-8">
                                            <Spinner size="large" />
                                        </div>
                                    }
                                >
                                    <Show
                                        when={!props.milestoneOptionsError}
                                        fallback={
                                            <EmptyMenuState message="Unable to load milestones." />
                                        }
                                    >
                                        <ActionList>
                                            <ActionList.Item
                                                active={
                                                    props.filters.noMilestone
                                                }
                                                onSelect={(event) => {
                                                    props.onPatchFilters({
                                                        milestone: "",
                                                        noMilestone:
                                                            !props.filters
                                                                .noMilestone,
                                                    });
                                                    closeDetailsMenu(
                                                        event.currentTarget,
                                                    );
                                                }}
                                            >
                                                No milestone
                                            </ActionList.Item>
                                            <Show
                                                when={props.filters.milestone}
                                            >
                                                <ActionList.Item
                                                    onSelect={(event) => {
                                                        props.onPatchFilters({
                                                            milestone: "",
                                                            noMilestone: false,
                                                        });
                                                        closeDetailsMenu(
                                                            event.currentTarget,
                                                        );
                                                    }}
                                                >
                                                    Clear milestone filter
                                                </ActionList.Item>
                                            </Show>
                                            <For each={visibleMilestones()}>
                                                {(milestone) => (
                                                    <ActionList.Item
                                                        active={
                                                            props.filters
                                                                .milestone ===
                                                            milestone.title
                                                        }
                                                        onSelect={(event) => {
                                                            props.onPatchFilters(
                                                                {
                                                                    milestone:
                                                                        milestone.title,
                                                                    noMilestone: false,
                                                                },
                                                            );
                                                            closeDetailsMenu(
                                                                event.currentTarget,
                                                            );
                                                        }}
                                                    >
                                                        <ActionList.LeadingVisual>
                                                            <Octicon
                                                                name="milestone"
                                                                size={16}
                                                                aria-hidden="true"
                                                            />
                                                        </ActionList.LeadingVisual>
                                                        {milestone.title}
                                                        <Show
                                                            when={
                                                                milestone.state
                                                            }
                                                        >
                                                            {(state) => (
                                                                <ActionList.Description variant="inline">
                                                                    {state()}
                                                                </ActionList.Description>
                                                            )}
                                                        </Show>
                                                    </ActionList.Item>
                                                )}
                                            </For>
                                        </ActionList>
                                    </Show>
                                </Show>
                            </div>
                        </MenuPanel>
                    </ToolbarMenu>

                    <ToolbarMenu
                        label={
                            props.filters.assignee ||
                            (props.filters.unassigned
                                ? "Unassigned"
                                : "Assignees")
                        }
                        active={hasAssigneeFilter()}
                    >
                        <MenuPanel heading="Filter by assignee">
                            <MenuSearchInput
                                placeholder="Filter assignees"
                                value={assigneeQuery()}
                                onInput={(event) =>
                                    setAssigneeQuery(event.currentTarget.value)
                                }
                            />
                            <div class="max-h-[24rem] overflow-y-auto">
                                <Show
                                    when={!props.assigneeOptionsPending}
                                    fallback={
                                        <div class="grid place-items-center px-4 py-8">
                                            <Spinner size="large" />
                                        </div>
                                    }
                                >
                                    <Show
                                        when={!props.assigneeOptionsError}
                                        fallback={
                                            <EmptyMenuState message="Unable to load assignees." />
                                        }
                                    >
                                        <ActionList>
                                            <ActionList.Item
                                                active={
                                                    props.filters.unassigned
                                                }
                                                onSelect={(event) => {
                                                    props.onPatchFilters({
                                                        assignee: "",
                                                        unassigned:
                                                            !props.filters
                                                                .unassigned,
                                                    });
                                                    closeDetailsMenu(
                                                        event.currentTarget,
                                                    );
                                                }}
                                            >
                                                Unassigned only
                                            </ActionList.Item>
                                            <Show when={props.filters.assignee}>
                                                <ActionList.Item
                                                    onSelect={(event) => {
                                                        props.onPatchFilters({
                                                            assignee: "",
                                                            unassigned: false,
                                                        });
                                                        closeDetailsMenu(
                                                            event.currentTarget,
                                                        );
                                                    }}
                                                >
                                                    Clear assignee filter
                                                </ActionList.Item>
                                            </Show>
                                            <For each={visibleAssignees()}>
                                                {(user) => (
                                                    <ActionList.Item
                                                        active={
                                                            props.filters
                                                                .assignee ===
                                                            user.login
                                                        }
                                                        onSelect={(event) => {
                                                            props.onPatchFilters(
                                                                {
                                                                    assignee:
                                                                        user.login,
                                                                    unassigned: false,
                                                                },
                                                            );
                                                            closeDetailsMenu(
                                                                event.currentTarget,
                                                            );
                                                        }}
                                                    >
                                                        <ActionList.LeadingVisual>
                                                            <AssigneeAvatar
                                                                assignee={user}
                                                                size={20}
                                                            />
                                                        </ActionList.LeadingVisual>
                                                        {user.login}
                                                    </ActionList.Item>
                                                )}
                                            </For>
                                        </ActionList>
                                    </Show>
                                </Show>
                            </div>
                        </MenuPanel>
                    </ToolbarMenu>

                    <ToolbarMenu
                        label={currentTypesLabel(
                            props.pageProps.kind,
                            props.filters,
                        )}
                        active={hasTypesFilter()}
                    >
                        <MenuPanel
                            heading={
                                props.pageProps.kind === "issues"
                                    ? "Issue types"
                                    : "Pull request types"
                            }
                            widthClass="w-[22rem]"
                        >
                            <div class="max-h-[26rem] overflow-y-auto">
                                <Show
                                    when={props.pageProps.kind === "issues"}
                                    fallback={
                                        <ActionList>
                                            <ActionList.Group title="Draft status">
                                                <For each={DRAFT_OPTIONS}>
                                                    {(option) => (
                                                        <ActionList.Item
                                                            active={
                                                                props.filters
                                                                    .draft ===
                                                                option.value
                                                            }
                                                            onSelect={(
                                                                event,
                                                            ) => {
                                                                props.onPatchFilters(
                                                                    {
                                                                        draft: option.value,
                                                                    },
                                                                );
                                                                closeDetailsMenu(
                                                                    event.currentTarget,
                                                                );
                                                            }}
                                                        >
                                                            {option.label}
                                                        </ActionList.Item>
                                                    )}
                                                </For>
                                            </ActionList.Group>
                                            <ActionList.Divider />
                                            <ActionList.Group title="Review state">
                                                <For each={REVIEW_OPTIONS}>
                                                    {(option) => (
                                                        <ActionList.Item
                                                            active={
                                                                props.filters
                                                                    .review ===
                                                                option.value
                                                            }
                                                            onSelect={(
                                                                event,
                                                            ) => {
                                                                props.onPatchFilters(
                                                                    {
                                                                        review: option.value,
                                                                    },
                                                                );
                                                                closeDetailsMenu(
                                                                    event.currentTarget,
                                                                );
                                                            }}
                                                        >
                                                            {option.label}
                                                        </ActionList.Item>
                                                    )}
                                                </For>
                                            </ActionList.Group>
                                        </ActionList>
                                    }
                                >
                                    <ActionList>
                                        <For each={REASON_OPTIONS}>
                                            {(option) => (
                                                <ActionList.Item
                                                    active={
                                                        props.filters.reason ===
                                                        option.value
                                                    }
                                                    onSelect={(event) => {
                                                        props.onPatchFilters({
                                                            reason: option.value,
                                                        });
                                                        closeDetailsMenu(
                                                            event.currentTarget,
                                                        );
                                                    }}
                                                >
                                                    {option.label}
                                                </ActionList.Item>
                                            )}
                                        </For>
                                    </ActionList>
                                </Show>
                            </div>
                        </MenuPanel>
                    </ToolbarMenu>

                    <ToolbarMenu
                        label={sortLabel(props.filters.sort)}
                        align="right"
                        leadingVisual={
                            <Octicon
                                name="sort-desc"
                                size={16}
                                aria-hidden="true"
                            />
                        }
                    >
                        <MenuPanel
                            heading="Sort by"
                            widthClass="w-[18rem]"
                            align="right"
                        >
                            <ActionList>
                                <For each={SORT_OPTIONS}>
                                    {(option) => (
                                        <ActionList.Item
                                            active={
                                                props.filters.sort ===
                                                option.value
                                            }
                                            onSelect={(event) => {
                                                props.onPatchFilters({
                                                    sort: option.value,
                                                });
                                                closeDetailsMenu(
                                                    event.currentTarget,
                                                );
                                            }}
                                        >
                                            {option.label}
                                        </ActionList.Item>
                                    )}
                                </For>
                            </ActionList>
                        </MenuPanel>
                    </ToolbarMenu>

                    <Button
                        as="a"
                        href={props.clearHref}
                        size="small"
                        variant="invisible"
                    >
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    );
}

function buildFilterChips(
    props: RepoWorkItemsPageProps,
    filters: WorkItemFilters,
): FilterChip[] {
    const chips: FilterChip[] = [];
    const defaults = defaultWorkItemFilters(props.kind);

    if (filters.q)
        chips.push({
            label: `Search: ${filters.q}`,
            href: withFilter(props, filters, { q: "" }),
        });
    if (filters.state !== defaults.state) {
        chips.push({
            label: `State: ${filters.state}`,
            href: withFilter(props, filters, { state: defaults.state }),
        });
    }
    if (filters.sort !== defaults.sort) {
        chips.push({
            label: `Sort: ${sortLabel(filters.sort)}`,
            href: withFilter(props, filters, { sort: defaults.sort }),
        });
    }
    for (const label of filters.labels) {
        chips.push({
            label: `Label: ${label}`,
            href: withFilter(props, filters, {
                labels: filters.labels.filter((item) => item !== label),
            }),
        });
    }
    if (filters.noLabels)
        chips.push({
            label: "No labels",
            href: withFilter(props, filters, { noLabels: false }),
        });
    if (filters.author)
        chips.push({
            label: `Author: ${filters.author}`,
            href: withFilter(props, filters, { author: "" }),
        });
    if (filters.assignee)
        chips.push({
            label: `Assignee: ${filters.assignee}`,
            href: withFilter(props, filters, { assignee: "" }),
        });
    if (filters.unassigned)
        chips.push({
            label: "Unassigned",
            href: withFilter(props, filters, { unassigned: false }),
        });
    if (filters.milestone)
        chips.push({
            label: `Milestone: ${filters.milestone}`,
            href: withFilter(props, filters, { milestone: "" }),
        });
    if (filters.noMilestone)
        chips.push({
            label: "No milestone",
            href: withFilter(props, filters, { noMilestone: false }),
        });
    if (props.kind === "pulls" && filters.draft !== "all") {
        chips.push({
            label: `Draft: ${draftLabel(filters.draft)}`,
            href: withFilter(props, filters, { draft: "all" }),
        });
    }
    if (props.kind === "pulls" && filters.review !== "all") {
        chips.push({
            label: `Review: ${reviewLabel(filters.review)}`,
            href: withFilter(props, filters, { review: "all" }),
        });
    }
    if (props.kind === "issues" && filters.reason !== "all") {
        chips.push({
            label: `Reason: ${reasonLabel(filters.reason)}`,
            href: withFilter(props, filters, { reason: "all" }),
        });
    }

    return chips;
}

function EmptyWorkItems(props: {
    pageProps: RepoWorkItemsPageProps;
    filters: WorkItemFilters;
    totalCount: number;
    clearHref: string;
}) {
    const isEmptyPage = () => props.filters.page > 1 && props.totalCount > 0;

    return (
        <div class="grid min-h-64 place-items-center p-8 text-center">
            <div class="max-w-md">
                <div class="mx-auto grid size-14 place-items-center rounded-full bg-[var(--bgColor-muted)]">
                    <Octicon name="search" size={24} aria-hidden="true" />
                </div>
                <h2 class="mt-4 text-lg font-semibold">
                    <Show
                        when={isEmptyPage()}
                        fallback={
                            <>No {itemNoun(props.pageProps.kind)} found</>
                        }
                    >
                        No results on this page
                    </Show>
                </h2>
                <p class="mt-1 text-sm text-[var(--fgColor-muted)]">
                    <Show
                        when={isEmptyPage()}
                        fallback={
                            <>
                                Try removing a filter, checking spelling, or
                                using GitHub search qualifiers directly in the
                                search box.
                            </>
                        }
                    >
                        The filters still match {formatCount(props.totalCount)}{" "}
                        {itemNoun(props.pageProps.kind, props.totalCount)}, but
                        page {props.filters.page} is outside the browsable
                        result range.
                    </Show>
                </p>
                <div class="mt-4 flex flex-wrap justify-center gap-2">
                    <Show when={isEmptyPage()}>
                        <Button
                            as="a"
                            href={pageHref(props.pageProps, props.filters, 1)}
                            variant="primary"
                            size="small"
                        >
                            Go to first page
                        </Button>
                    </Show>
                    <Button
                        as="a"
                        href={props.clearHref}
                        size="small"
                        variant="default"
                    >
                        Clear filters
                    </Button>
                </div>
            </div>
        </div>
    );
}

function RepoWorkItemsPage(props: RepoWorkItemsPageProps) {
    const [searchParams, setSearchParams] = useSearchParams<SearchParamShape>();
    const [searchText, setSearchText] = createSignal("");
    const filters = createMemo(() =>
        normalizeWorkItemFilters(searchParams, props.kind),
    );
    const clearHref = createMemo(() =>
        filterHref(props, defaultWorkItemFilters(props.kind)),
    );
    const chips = createMemo(() => buildFilterChips(props, filters()));

    createEffect(() => {
        setSearchText(filters().q);
    });

    const workItemsQuery = useQuery(() => ({
        queryKey: [
            "workItems",
            props.profile,
            props.repo,
            props.kind,
            filters(),
        ],
        queryFn: () =>
            fetchWorkItems({
                owner: props.profile,
                repo: props.repo,
                kind: props.kind,
                filters: filters(),
            }),
        keepPreviousData: true,
    }));
    const openCountQuery = useQuery(() => ({
        queryKey: [
            "workItemCount",
            props.profile,
            props.repo,
            props.kind,
            "open",
            { ...filters(), state: "open", page: 1 },
        ],
        queryFn: () =>
            fetchWorkItems({
                owner: props.profile,
                repo: props.repo,
                kind: props.kind,
                filters: { ...filters(), state: "open", page: 1 },
                perPage: 1,
            }),
        keepPreviousData: true,
    }));
    const closedCountQuery = useQuery(() => ({
        queryKey: [
            "workItemCount",
            props.profile,
            props.repo,
            props.kind,
            "closed",
            { ...filters(), state: "closed", page: 1 },
        ],
        queryFn: () =>
            fetchWorkItems({
                owner: props.profile,
                repo: props.repo,
                kind: props.kind,
                filters: { ...filters(), state: "closed", page: 1 },
                perPage: 1,
            }),
        keepPreviousData: true,
    }));
    const labelOptionsQuery = useQuery(() => ({
        queryKey: ["workItemLabels", props.profile, props.repo],
        queryFn: () =>
            fetchRepoLabels({ owner: props.profile, repo: props.repo }),
        staleTime: 60_000,
    }));
    const milestoneOptionsQuery = useQuery(() => ({
        queryKey: ["workItemMilestones", props.profile, props.repo],
        queryFn: () =>
            fetchRepoMilestones({ owner: props.profile, repo: props.repo }),
        staleTime: 60_000,
    }));
    const assigneeOptionsQuery = useQuery(() => ({
        queryKey: ["workItemAssignees", props.profile, props.repo],
        queryFn: () =>
            fetchRepoAssignees({ owner: props.profile, repo: props.repo }),
        staleTime: 60_000,
    }));

    const authorOptions = createMemo(() => {
        const seen = new Map<string, WorkItemUser>();
        for (const item of workItemsQuery.data?.items ?? []) {
            if (item.user?.login && !seen.has(item.user.login)) {
                seen.set(item.user.login, item.user);
            }
        }
        return Array.from(seen.values()).sort((a, b) =>
            a.login.localeCompare(b.login),
        );
    });

    const visibleTotal = createMemo(() =>
        Math.min(workItemsQuery.data?.totalCount ?? 0, SEARCH_RESULT_LIMIT),
    );
    const totalPages = createMemo(() =>
        Math.max(1, Math.ceil(visibleTotal() / WORK_ITEMS_PER_PAGE)),
    );

    function applyFilters(next: WorkItemFilters) {
        setSearchParams(workItemFiltersToSearchParams(next));
    }

    function patchFilters(patch: Partial<WorkItemFilters>) {
        applyFilters({ ...filters(), ...patch, page: 1 });
    }

    function handleSearchSubmit(event: SubmitEvent) {
        event.preventDefault();
        patchFilters({ q: searchText() });
    }

    return (
        <RepoPageLayout
            profile={props.profile}
            repo={props.repo}
            active={props.kind}
        >
            <section class="space-y-4" aria-label={pageTitle(props.kind)}>
                <WorkItemsSearchControls
                    pageProps={props}
                    filters={filters()}
                    searchText={searchText()}
                    onSearchInput={(event) =>
                        setSearchText(event.currentTarget.value)
                    }
                    onSearchSubmit={handleSearchSubmit}
                />

                <ActiveFilters chips={chips()} clearHref={clearHref()} />

                <div class="overflow-visible rounded-xl border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] shadow-sm">
                    <WorkItemsToolbar
                        pageProps={props}
                        filters={filters()}
                        clearHref={clearHref()}
                        openHref={withFilter(props, filters(), {
                            state: "open",
                        })}
                        closedHref={withFilter(props, filters(), {
                            state: "closed",
                        })}
                        openCount={openCountQuery.data?.totalCount}
                        closedCount={closedCountQuery.data?.totalCount}
                        openPending={openCountQuery.isPending}
                        closedPending={closedCountQuery.isPending}
                        authorOptions={authorOptions()}
                        labelOptions={labelOptionsQuery.data ?? []}
                        assigneeOptions={assigneeOptionsQuery.data ?? []}
                        milestoneOptions={milestoneOptionsQuery.data ?? []}
                        labelOptionsPending={labelOptionsQuery.isPending}
                        assigneeOptionsPending={assigneeOptionsQuery.isPending}
                        milestoneOptionsPending={
                            milestoneOptionsQuery.isPending
                        }
                        labelOptionsError={labelOptionsQuery.isError}
                        assigneeOptionsError={assigneeOptionsQuery.isError}
                        milestoneOptionsError={milestoneOptionsQuery.isError}
                        onPatchFilters={patchFilters}
                    />

                    <Switch>
                        <Match when={workItemsQuery.isPending}>
                            <div class="grid min-h-64 place-items-center p-8 text-center">
                                <div>
                                    <Spinner size="large" />
                                    <p class="mt-3 font-medium">
                                        Loading {itemNoun(props.kind)}…
                                    </p>
                                </div>
                            </div>
                        </Match>
                        <Match when={workItemsQuery.isError}>
                            <div class="p-4">
                                <Flash
                                    variant="danger"
                                    class="flex items-start gap-3"
                                >
                                    <Octicon
                                        name="alert"
                                        size={20}
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <h2 class="font-semibold">
                                            Unable to load{" "}
                                            {itemNoun(props.kind)}
                                        </h2>
                                        <p class="text-sm">
                                            {getErrorMessage(
                                                workItemsQuery.error,
                                            )}
                                        </p>
                                    </div>
                                </Flash>
                            </div>
                        </Match>
                        <Match when={workItemsQuery.data}>
                            {(result) => (
                                <>
                                    <Show when={result().incompleteResults}>
                                        <div class="p-4 pb-0">
                                            <Flash
                                                variant="warning"
                                                class="flex items-center gap-2"
                                            >
                                                <Octicon
                                                    name="alert"
                                                    size={18}
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    GitHub returned partial
                                                    results. Try narrowing your
                                                    filters.
                                                </span>
                                            </Flash>
                                        </div>
                                    </Show>

                                    <Show
                                        when={result().items.length > 0}
                                        fallback={
                                            <EmptyWorkItems
                                                pageProps={props}
                                                filters={filters()}
                                                totalCount={result().totalCount}
                                                clearHref={clearHref()}
                                            />
                                        }
                                    >
                                        <ul>
                                            <For each={result().items}>
                                                {(item) => (
                                                    <WorkItemRow
                                                        item={item}
                                                        kind={props.kind}
                                                    />
                                                )}
                                            </For>
                                        </ul>
                                    </Show>
                                </>
                            )}
                        </Match>
                    </Switch>
                </div>

                <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p class="text-sm text-[var(--fgColor-muted)]">
                        <Show when={workItemsQuery.data}>
                            {(result) => (
                                <>
                                    Showing {result().items.length} of{" "}
                                    {formatCount(result().totalCount)}{" "}
                                    {itemNoun(props.kind, result().totalCount)}
                                    <Show
                                        when={
                                            result().totalCount >
                                            SEARCH_RESULT_LIMIT
                                        }
                                    >
                                        {" "}
                                        (GitHub search caps browsing at 1,000
                                        results)
                                    </Show>
                                    <Show
                                        when={
                                            workItemsQuery.isFetching &&
                                            !workItemsQuery.isPending
                                        }
                                    >
                                        <span class="ml-2 inline-flex align-middle">
                                            <Spinner
                                                size="small"
                                                srText={null}
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </Show>
                                </>
                            )}
                        </Show>
                    </p>
                    <Pagination
                        currentPage={filters().page}
                        pageCount={totalPages()}
                        hrefBuilder={(nextPage) =>
                            pageHref(props, filters(), nextPage)
                        }
                        aria-label={`${pageTitle(props.kind)} pagination`}
                        class="w-full sm:ml-auto sm:w-auto"
                    />
                </div>
            </section>
        </RepoPageLayout>
    );
}

export default RepoWorkItemsPage;
