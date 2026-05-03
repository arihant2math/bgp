import { useSearchParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch, createMemo, type JSX } from "solid-js";
import { format } from "timeago.js";
import Octicon from "./Octicon.tsx";
import RepoPageLayout from "./RepoPageLayout.tsx";
import {
    SEARCH_RESULT_LIMIT,
    WORK_ITEMS_PER_PAGE,
    defaultWorkItemFilters,
    fetchWorkItems,
    normalizeWorkItemFilters,
    workItemFiltersToSearchParams,
} from "../lib/githubWorkItems.ts";
import type {
    IssueReasonFilter,
    PullDraftFilter,
    PullReviewFilter,
    WorkItem,
    WorkItemFilters,
    WorkItemKind,
    WorkItemLabel,
    WorkItemSort,
    WorkItemUser,
    WorkItemState,
} from "../lib/githubWorkItems.ts";
import { repoHref } from "../lib/hrefGen.ts";

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

function isValidDate(value: string) {
    return !Number.isNaN(new Date(value).getTime());
}

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Unknown date"
        : date.toLocaleString();
}

function relativeTime(value: string) {
    return isValidDate(value) ? format(value) : "unknown date";
}

function getErrorMessage(error: unknown) {
    const candidate = error as { message?: string; status?: number };
    const prefix = candidate.status
        ? `GitHub returned ${candidate.status}. `
        : "";
    return `${prefix}${candidate.message ?? "Something went wrong."}`;
}

function labelTextColor(hex: string | null | undefined) {
    if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return "var(--color-base-content)";
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    return luminance > 0.58 ? "#111827" : "#ffffff";
}

function labelBackground(hex: string | null | undefined) {
    return hex && /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : undefined;
}

function itemIcon(item: WorkItem, kind: WorkItemKind) {
    if (kind === "pulls") {
        if (item.draft) {
            return {
                name: "git-pull-request-draft" as const,
                class: "text-base-content/60",
            };
        }
        if (item.state === "open") {
            return { name: "git-pull-request" as const, class: "text-success" };
        }
        if (item.pull_request?.merged_at) {
            return { name: "git-merge" as const, class: "text-secondary" };
        }
        return {
            name: "git-pull-request-closed" as const,
            class: "text-error",
        };
    }

    if (item.state === "open") {
        return { name: "issue-opened" as const, class: "text-success" };
    }
    if (item.state_reason === "not_planned") {
        return { name: "skip" as const, class: "text-error" };
    }
    return { name: "issue-closed" as const, class: "text-secondary" };
}

function stateLabel(item: WorkItem, kind: WorkItemKind) {
    if (kind === "pulls") {
        if (item.draft) return "Draft";
        if (item.state === "open") return "Open";
        if (item.pull_request?.merged_at) return "Merged";
        return "Closed";
    }

    if (item.state === "open") return "Open";
    if (item.state_reason === "not_planned") return "Not planned";
    return "Closed";
}

function stateBadgeClass(item: WorkItem, kind: WorkItemKind) {
    if (kind === "pulls" && item.pull_request?.merged_at)
        return "badge-secondary";
    if (item.state === "open") return "badge-success";
    if (kind === "issues" && item.state_reason === "not_planned")
        return "badge-error";
    if (kind === "pulls" && item.draft) return "badge-ghost";
    return "badge-neutral";
}

function WorkItemLabelBadge(props: { label: WorkItemLabel }) {
    const background = () => labelBackground(props.label.color);

    return (
        <span
            class="badge badge-sm border-0 font-medium"
            title={props.label.description ?? props.label.name}
            style={{
                "background-color": background() ?? "var(--color-base-300)",
                color: background()
                    ? labelTextColor(props.label.color)
                    : "var(--color-base-content)",
            }}
        >
            {props.label.name}
        </span>
    );
}

function AssigneeAvatar(props: { assignee: WorkItemUser }) {
    return (
        <div class="avatar" title={props.assignee.login}>
            <div class="w-6 rounded-full bg-base-300 ring-2 ring-base-100">
                <Show
                    when={props.assignee.avatar_url}
                    fallback={
                        <div class="grid size-full place-items-center">
                            <Octicon
                                name="person"
                                size={12}
                                aria-hidden="true"
                            />
                        </div>
                    }
                >
                    {(avatarUrl) => (
                        <img
                            src={avatarUrl()}
                            alt={`${props.assignee.login}'s avatar`}
                        />
                    )}
                </Show>
            </div>
        </div>
    );
}

function WorkItemRow(props: { item: WorkItem; kind: WorkItemKind }) {
    const icon = () => itemIcon(props.item, props.kind);
    const assignees = createMemo(() => props.item.assignees ?? []);
    const shouldShowState = () =>
        props.item.state !== "open" ||
        props.item.draft ||
        props.item.pull_request?.merged_at;

    return (
        <li class="flex items-start gap-3 border-b border-base-300 px-4 py-4 last:border-b-0 hover:bg-base-200/60">
            <div class="pt-1">
                <Octicon
                    name={icon().name}
                    size={20}
                    class={icon().class}
                    aria-hidden="true"
                />
            </div>

            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 leading-6">
                    <a
                        href={props.item.html_url}
                        target="_blank"
                        rel="noreferrer"
                        class="link-hover min-w-0 text-base font-semibold text-base-content"
                    >
                        {props.item.title || "Untitled"}
                    </a>
                    <Show when={shouldShowState()}>
                        <span
                            class={`badge badge-sm ${stateBadgeClass(props.item, props.kind)}`}
                        >
                            {stateLabel(props.item, props.kind)}
                        </span>
                    </Show>
                    <Show when={props.item.locked}>
                        <span class="badge badge-sm badge-warning gap-1">
                            <Octicon name="lock" size={12} aria-hidden="true" />
                            Locked
                        </span>
                    </Show>
                    <For each={props.item.labels}>
                        {(label) => <WorkItemLabelBadge label={label} />}
                    </For>
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-base-content/70">
                    <span>#{props.item.number}</span>
                    <span aria-hidden="true">·</span>
                    <Show when={props.item.user?.login}>
                        {(login) => (
                            <>
                                <a
                                    href={
                                        props.item.user?.html_url ?? undefined
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    class="link-hover"
                                >
                                    {login()}
                                </a>
                                <span>opened</span>
                            </>
                        )}
                    </Show>
                    <time
                        dateTime={props.item.created_at}
                        title={formatDate(props.item.created_at)}
                    >
                        {relativeTime(props.item.created_at)}
                    </time>
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

            <div class="hidden min-w-36 shrink-0 items-center justify-end gap-5 pt-1 text-sm text-base-content/70 md:flex">
                <Show when={props.kind === "pulls" && props.item.comments > 0}>
                    <div
                        class="inline-flex items-center gap-1"
                        title={`${props.item.comments} comments`}
                    >
                        <Octicon name="comment" size={16} aria-hidden="true" />
                        {formatCount(props.item.comments)}
                    </div>
                </Show>
                <Show when={props.kind === "issues" && props.item.comments > 0}>
                    <div
                        class="inline-flex items-center gap-1"
                        title={`${props.item.comments} comments`}
                    >
                        <Octicon name="comment" size={16} aria-hidden="true" />
                        {formatCount(props.item.comments)}
                    </div>
                </Show>
                <Show when={assignees().length > 0}>
                    <div class="avatar-group -space-x-3 rtl:space-x-reverse">
                        <For each={assignees().slice(0, 3)}>
                            {(assignee) => (
                                <AssigneeAvatar assignee={assignee} />
                            )}
                        </For>
                        <Show when={assignees().length > 3}>
                            <div class="avatar placeholder">
                                <div class="w-6 rounded-full bg-base-300 text-[10px]">
                                    +{assignees().length - 3}
                                </div>
                            </div>
                        </Show>
                    </div>
                </Show>
            </div>
        </li>
    );
}

function ActiveFilters(props: { chips: FilterChip[]; clearHref: string }) {
    return (
        <Show when={props.chips.length > 0}>
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-base-content/70">Filters</span>
                <For each={props.chips}>
                    {(chip) => (
                        <a
                            href={chip.href}
                            class="badge badge-outline gap-1 py-3 hover:bg-base-200"
                        >
                            {chip.label}
                            <Octicon name="x" size={12} aria-hidden="true" />
                        </a>
                    )}
                </For>
                <a href={props.clearHref} class="btn btn-ghost btn-xs">
                    Clear all
                </a>
            </div>
        </Show>
    );
}

function WorkItemsSearchControls(props: {
    pageProps: RepoWorkItemsPageProps;
    filters: WorkItemFilters;
}) {
    const qualifier = () =>
        props.pageProps.kind === "issues" ? "is:issue" : "is:pr";
    const stateQualifier = () =>
        props.filters.state === "all"
            ? "state:open state:closed"
            : `state:${props.filters.state}`;
    const githubBase = () =>
        `https://github.com/${encodeURIComponent(props.pageProps.profile)}/${encodeURIComponent(props.pageProps.repo)}`;
    const newHref = () =>
        props.pageProps.kind === "issues"
            ? `${githubBase()}/issues/new`
            : `${githubBase()}/compare`;

    return (
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="join min-w-0 flex-1">
                <label class="input input-bordered join-item flex h-9 min-h-9 flex-1 items-center gap-1.5 overflow-hidden rounded-r-none border-base-300 bg-base-100 focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-primary/40">
                    <span class="rounded bg-info/15 px-0.5 text-info">
                        {qualifier()}
                    </span>
                    <span class="rounded bg-info/15 px-0.5 text-info">
                        {stateQualifier()}
                    </span>
                    <input
                        name="q"
                        type="search"
                        class="min-w-24 grow"
                        value={props.filters.q}
                        placeholder={`Search ${itemNoun(props.pageProps.kind)}`}
                        autocomplete="off"
                    />
                </label>
                <button
                    type="submit"
                    class="btn btn-outline join-item h-9 min-h-9 border-base-300 px-4"
                    aria-label={`Search ${itemNoun(props.pageProps.kind)}`}
                >
                    <Octicon name="search" size={18} aria-hidden="true" />
                </button>
            </div>

            <div class="flex flex-wrap gap-2">
                <a
                    href={`${githubBase()}/labels`}
                    target="_blank"
                    rel="noreferrer"
                    class="btn btn-outline h-9 min-h-9 border-base-300"
                >
                    <Octicon name="tag" size={16} aria-hidden="true" />
                    Labels
                </a>
                <a
                    href={`${githubBase()}/milestones`}
                    target="_blank"
                    rel="noreferrer"
                    class="btn btn-outline h-9 min-h-9 border-base-300"
                >
                    <Octicon name="milestone" size={16} aria-hidden="true" />
                    Milestones
                </a>
                <a
                    href={newHref()}
                    target="_blank"
                    rel="noreferrer"
                    class="btn btn-success h-9 min-h-9"
                >
                    {props.pageProps.kind === "issues"
                        ? "New issue"
                        : "New pull request"}
                </a>
            </div>
        </div>
    );
}

function FilterDropdown(props: { label: string; children: JSX.Element }) {
    return (
        <details class="dropdown dropdown-end">
            <summary class="btn btn-ghost btn-sm h-8 min-h-8 gap-1 px-2 text-sm font-medium text-base-content/75 hover:text-base-content">
                {props.label}
                <Octicon name="triangle-down" size={12} aria-hidden="true" />
            </summary>
            <div class="menu dropdown-content z-20 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-4 shadow-xl">
                {props.children}
                <div class="mt-4 flex justify-end gap-2">
                    <button type="submit" class="btn btn-primary btn-sm">
                        Apply
                    </button>
                </div>
            </div>
        </details>
    );
}

function CountPill(props: { count?: number; pending: boolean }) {
    return (
        <span class="rounded-full bg-base-300/70 px-2 py-0.5 text-sm font-semibold text-base-content">
            <Show
                when={!props.pending}
                fallback={<span class="loading loading-spinner loading-xs" />}
            >
                {formatCount(props.count ?? 0)}
            </Show>
        </span>
    );
}

function WorkItemsToolbar(props: {
    pageProps: RepoWorkItemsPageProps;
    filters: WorkItemFilters;
    clearHref: string;
    openHref: string;
    closedHref: string;
    openCount?: number;
    closedCount?: number;
    openPending: boolean;
    closedPending: boolean;
}) {
    const activeStateClass = (state: WorkItemState) =>
        props.filters.state === state
            ? "font-semibold text-base-content"
            : "font-medium text-base-content/70 hover:text-base-content";

    return (
        <div class="flex flex-col gap-3 border-b border-base-300 bg-base-200/60 px-4 py-3 lg:flex-row lg:items-center">
            <input type="hidden" name="state" value={props.filters.state} />
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                    href={props.openHref}
                    class={`inline-flex items-center gap-2 ${activeStateClass("open")}`}
                >
                    <Octicon
                        name={
                            props.pageProps.kind === "issues"
                                ? "issue-opened"
                                : "git-pull-request"
                        }
                        size={16}
                        class="text-success"
                        aria-hidden="true"
                    />
                    Open
                    <CountPill
                        count={props.openCount}
                        pending={props.openPending}
                    />
                </a>
                <a
                    href={props.closedHref}
                    class={`inline-flex items-center gap-2 ${activeStateClass("closed")}`}
                >
                    <Octicon
                        name={
                            props.pageProps.kind === "issues"
                                ? "issue-closed"
                                : "git-pull-request-closed"
                        }
                        size={16}
                        class="text-base-content/50"
                        aria-hidden="true"
                    />
                    Closed
                    <CountPill
                        count={props.closedCount}
                        pending={props.closedPending}
                    />
                </a>
                <Show when={props.filters.state === "all"}>
                    <span class="badge badge-outline">Viewing all</span>
                </Show>
            </div>

            <div class="flex flex-wrap items-center gap-1 lg:ml-auto">
                <FilterDropdown label="Author">
                    <fieldset class="fieldset p-0">
                        <legend class="fieldset-legend">
                            Filter by author
                        </legend>
                        <input
                            name="author"
                            class="input input-bordered input-sm w-full"
                            value={props.filters.author}
                            placeholder="octocat"
                            autocomplete="off"
                        />
                    </fieldset>
                </FilterDropdown>

                <FilterDropdown label="Labels">
                    <fieldset class="fieldset p-0">
                        <legend class="fieldset-legend">
                            Filter by labels
                        </legend>
                        <input
                            name="labels"
                            class="input input-bordered input-sm w-full"
                            value={props.filters.labels.join(", ")}
                            placeholder="bug, help wanted"
                            disabled={props.filters.noLabels}
                        />
                        <label class="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                name="noLabels"
                                class="checkbox checkbox-sm"
                                checked={props.filters.noLabels}
                            />
                            <span class="label-text">Unlabeled only</span>
                        </label>
                    </fieldset>
                </FilterDropdown>

                <FilterDropdown label="Projects">
                    <p class="text-sm text-base-content/70">
                        Project filters are not available through GitHub issue
                        search. Use labels, milestones, and assignees instead.
                    </p>
                </FilterDropdown>

                <FilterDropdown label="Milestones">
                    <fieldset class="fieldset p-0">
                        <legend class="fieldset-legend">
                            Filter by milestone
                        </legend>
                        <input
                            name="milestone"
                            class="input input-bordered input-sm w-full"
                            value={props.filters.milestone}
                            placeholder="v1.0"
                            disabled={props.filters.noMilestone}
                        />
                        <label class="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                name="noMilestone"
                                class="checkbox checkbox-sm"
                                checked={props.filters.noMilestone}
                            />
                            <span class="label-text">No milestone</span>
                        </label>
                    </fieldset>
                </FilterDropdown>

                <FilterDropdown label="Assignees">
                    <fieldset class="fieldset p-0">
                        <legend class="fieldset-legend">
                            Filter by assignee
                        </legend>
                        <input
                            name="assignee"
                            class="input input-bordered input-sm w-full"
                            value={props.filters.assignee}
                            placeholder="octocat"
                            autocomplete="off"
                            disabled={props.filters.unassigned}
                        />
                        <label class="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                name="unassigned"
                                class="checkbox checkbox-sm"
                                checked={props.filters.unassigned}
                            />
                            <span class="label-text">Unassigned only</span>
                        </label>
                    </fieldset>
                </FilterDropdown>

                <FilterDropdown label="Types">
                    <Show
                        when={props.pageProps.kind === "pulls"}
                        fallback={
                            <fieldset class="fieldset p-0">
                                <legend class="fieldset-legend">
                                    Closed issue reason
                                </legend>
                                <select
                                    name="reason"
                                    class="select select-bordered select-sm w-full"
                                    value={props.filters.reason}
                                >
                                    <For each={REASON_OPTIONS}>
                                        {(option) => (
                                            <option value={option.value}>
                                                {option.label}
                                            </option>
                                        )}
                                    </For>
                                </select>
                            </fieldset>
                        }
                    >
                        <fieldset class="fieldset p-0">
                            <legend class="fieldset-legend">
                                Pull request status
                            </legend>
                            <select
                                name="draft"
                                class="select select-bordered select-sm w-full"
                                value={props.filters.draft}
                            >
                                <For each={DRAFT_OPTIONS}>
                                    {(option) => (
                                        <option value={option.value}>
                                            {option.label}
                                        </option>
                                    )}
                                </For>
                            </select>
                            <select
                                name="review"
                                class="select select-bordered select-sm w-full"
                                value={props.filters.review}
                            >
                                <For each={REVIEW_OPTIONS}>
                                    {(option) => (
                                        <option value={option.value}>
                                            {option.label}
                                        </option>
                                    )}
                                </For>
                            </select>
                        </fieldset>
                    </Show>
                </FilterDropdown>

                <FilterDropdown
                    label={
                        SORT_OPTIONS.find(
                            (option) => option.value === props.filters.sort,
                        )?.label ?? "Newest"
                    }
                >
                    <fieldset class="fieldset p-0">
                        <legend class="fieldset-legend">Sort by</legend>
                        <select
                            name="sort"
                            class="select select-bordered select-sm w-full"
                            value={props.filters.sort}
                        >
                            <For each={SORT_OPTIONS}>
                                {(option) => (
                                    <option value={option.value}>
                                        {option.label}
                                    </option>
                                )}
                            </For>
                        </select>
                    </fieldset>
                </FilterDropdown>

                <a href={props.clearHref} class="btn btn-ghost btn-sm">
                    Reset
                </a>
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
            label: `Sort: ${filters.sort.replaceAll("-", " ")}`,
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
            label: filters.draft === "draft" ? "Draft" : "Ready",
            href: withFilter(props, filters, { draft: "all" }),
        });
    }
    if (props.kind === "pulls" && filters.review !== "all") {
        chips.push({
            label: `Review: ${filters.review.replace("-", " ")}`,
            href: withFilter(props, filters, { review: "all" }),
        });
    }
    if (props.kind === "issues" && filters.reason !== "all") {
        chips.push({
            label: `Reason: ${filters.reason.replace("-", " ")}`,
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
                <div class="mx-auto grid size-14 place-items-center rounded-full bg-base-200">
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
                <p class="mt-1 text-sm opacity-70">
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
                        <a
                            href={pageHref(props.pageProps, props.filters, 1)}
                            class="btn btn-primary btn-sm"
                        >
                            Go to first page
                        </a>
                    </Show>
                    <a href={props.clearHref} class="btn btn-ghost btn-sm">
                        Clear filters
                    </a>
                </div>
            </div>
        </div>
    );
}

function RepoWorkItemsPage(props: RepoWorkItemsPageProps) {
    const [searchParams, setSearchParams] = useSearchParams<SearchParamShape>();
    const filters = createMemo(() =>
        normalizeWorkItemFilters(searchParams, props.kind),
    );
    const clearHref = createMemo(() =>
        filterHref(props, defaultWorkItemFilters(props.kind)),
    );
    const chips = createMemo(() => buildFilterChips(props, filters()));
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
    const visibleTotal = createMemo(() =>
        Math.min(workItemsQuery.data?.totalCount ?? 0, SEARCH_RESULT_LIMIT),
    );
    const hasPrevious = createMemo(() => filters().page > 1);
    const hasNext = createMemo(
        () => filters().page * WORK_ITEMS_PER_PAGE < visibleTotal(),
    );

    function applyFilters(next: WorkItemFilters) {
        setSearchParams(workItemFiltersToSearchParams(next));
    }

    function handleFiltersSubmit(event: SubmitEvent) {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const data = new FormData(form);
        const current = filters();
        const next = normalizeWorkItemFilters(
            {
                q: String(data.get("q") ?? ""),
                state: String(data.get("state") ?? current.state),
                sort: String(data.get("sort") ?? current.sort),
                labels: data.has("labels")
                    ? String(data.get("labels") ?? "")
                    : current.labels.join(","),
                noLabels: data.has("noLabels") ? "1" : undefined,
                author: data.has("author")
                    ? String(data.get("author") ?? "")
                    : current.author,
                assignee: data.has("assignee")
                    ? String(data.get("assignee") ?? "")
                    : current.assignee,
                unassigned: data.has("unassigned") ? "1" : undefined,
                milestone: data.has("milestone")
                    ? String(data.get("milestone") ?? "")
                    : current.milestone,
                noMilestone: data.has("noMilestone") ? "1" : undefined,
                draft: data.has("draft")
                    ? String(data.get("draft") ?? "")
                    : current.draft,
                review: data.has("review")
                    ? String(data.get("review") ?? "")
                    : current.review,
                reason: data.has("reason")
                    ? String(data.get("reason") ?? "")
                    : current.reason,
                page: "1",
            },
            props.kind,
        );
        applyFilters(next);
    }

    return (
        <RepoPageLayout
            profile={props.profile}
            repo={props.repo}
            active={props.kind}
        >
            <section class="space-y-4" aria-label={pageTitle(props.kind)}>
                <form onSubmit={handleFiltersSubmit} class="space-y-4">
                    <WorkItemsSearchControls
                        pageProps={props}
                        filters={filters()}
                    />

                    <ActiveFilters chips={chips()} clearHref={clearHref()} />

                    <div class="overflow-visible rounded-box border border-base-300 bg-base-100 shadow-sm">
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
                        />

                        <Switch>
                            <Match when={workItemsQuery.isPending}>
                                <div class="grid min-h-64 place-items-center p-8 text-center">
                                    <div>
                                        <span class="loading loading-spinner loading-lg text-primary" />
                                        <p class="mt-3 font-medium">
                                            Loading {itemNoun(props.kind)}…
                                        </p>
                                    </div>
                                </div>
                            </Match>
                            <Match when={workItemsQuery.isError}>
                                <div class="p-4">
                                    <div
                                        role="alert"
                                        class="alert alert-error items-start"
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
                                    </div>
                                </div>
                            </Match>
                            <Match when={workItemsQuery.data}>
                                {(result) => (
                                    <>
                                        <Show when={result().incompleteResults}>
                                            <div class="p-4 pb-0">
                                                <div
                                                    role="alert"
                                                    class="alert alert-warning"
                                                >
                                                    <Octicon
                                                        name="alert"
                                                        size={18}
                                                        aria-hidden="true"
                                                    />
                                                    <span>
                                                        GitHub returned partial
                                                        results. Try narrowing
                                                        your filters.
                                                    </span>
                                                </div>
                                            </div>
                                        </Show>

                                        <Show
                                            when={result().items.length > 0}
                                            fallback={
                                                <EmptyWorkItems
                                                    pageProps={props}
                                                    filters={filters()}
                                                    totalCount={
                                                        result().totalCount
                                                    }
                                                    clearHref={clearHref()}
                                                />
                                            }
                                        >
                                            <ul class="bg-base-100">
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
                </form>

                <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p class="text-sm text-base-content/70">
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
                                        <span class="ml-2 loading loading-spinner loading-xs" />
                                    </Show>
                                </>
                            )}
                        </Show>
                    </p>
                    <div class="join">
                        <Show
                            when={hasPrevious()}
                            fallback={
                                <button
                                    type="button"
                                    class="btn join-item"
                                    disabled
                                >
                                    Previous
                                </button>
                            }
                        >
                            <a
                                href={pageHref(
                                    props,
                                    filters(),
                                    filters().page - 1,
                                )}
                                class="btn join-item"
                            >
                                Previous
                            </a>
                        </Show>
                        <button
                            type="button"
                            class="btn join-item btn-ghost"
                            disabled
                        >
                            Page {filters().page}
                        </button>
                        <Show
                            when={hasNext()}
                            fallback={
                                <button
                                    type="button"
                                    class="btn join-item"
                                    disabled
                                >
                                    Next
                                </button>
                            }
                        >
                            <a
                                href={pageHref(
                                    props,
                                    filters(),
                                    filters().page + 1,
                                )}
                                class="btn join-item"
                            >
                                Next
                            </a>
                        </Show>
                    </div>
                </div>
            </section>
        </RepoPageLayout>
    );
}

export default RepoWorkItemsPage;
