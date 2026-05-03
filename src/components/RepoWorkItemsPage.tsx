import { useSearchParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch, createMemo, type JSX } from "solid-js";
import {
    Button,
    Checkbox,
    CounterLabel,
    Details,
    Flash,
    IssueLabelToken,
    Label,
    Select,
    Spinner,
    TextInput,
    Token,
} from "../vendor/primer-solid";
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

function stateLabelVariant(item: WorkItem, kind: WorkItemKind) {
    if (kind === "pulls" && item.pull_request?.merged_at) return "done" as const;
    if (item.state === "open") return "success" as const;
    if (kind === "issues" && item.state_reason === "not_planned")
        return "danger" as const;
    if (kind === "pulls" && item.draft) return "secondary" as const;
    return "default" as const;
}

function WorkItemLabelBadge(props: { label: WorkItemLabel }) {
    const background = () => labelBackground(props.label.color);

    return (
        <IssueLabelToken
            text={props.label.name}
            title={props.label.description ?? props.label.name}
            fillColor={background() ?? "#d1d9e0"}
        />
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
                        <Label variant={stateLabelVariant(props.item, props.kind)}>
                            {stateLabel(props.item, props.kind)}
                        </Label>
                    </Show>
                    <Show when={props.item.locked}>
                        <Token
                            text="Locked"
                            leadingVisual={<Octicon name="lock" size={12} aria-hidden="true" />}
                        />
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
                        <Token as="a" href={chip.href} text={chip.label} />
                    )}
                </For>
                <Button as="a" href={props.clearHref} variant="invisible" size="small">
                    Clear all
                </Button>
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
            <div class="min-w-0 flex-1">
                <TextInput
                    name="q"
                    type="search"
                    value={props.filters.q}
                    placeholder={`Search ${itemNoun(props.pageProps.kind)}`}
                    autocomplete="off"
                    block
                    leadingVisual={
                        <div class="flex items-center gap-1.5">
                            <Token text={qualifier()} />
                            <Token text={stateQualifier()} />
                        </div>
                    }
                    trailingAction={
                        <TextInput.Action
                            type="submit"
                            aria-label={`Search ${itemNoun(props.pageProps.kind)}`}
                            icon={() => (
                                <Octicon
                                    name="search"
                                    size={18}
                                    aria-hidden="true"
                                />
                            )}
                        />
                    }
                />
            </div>

            <div class="flex flex-wrap gap-2">
                <Button
                    as="a"
                    href={`${githubBase()}/labels`}
                    target="_blank"
                    rel="noreferrer"
                    leadingVisual={<Octicon name="tag" size={16} aria-hidden="true" />}
                >
                    Labels
                </Button>
                <Button
                    as="a"
                    href={`${githubBase()}/milestones`}
                    target="_blank"
                    rel="noreferrer"
                    leadingVisual={
                        <Octicon name="milestone" size={16} aria-hidden="true" />
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

function FilterDropdown(props: { label: string; children: JSX.Element }) {
    return (
        <Details class="relative">
            <Details.Summary
                as={Button}
                variant="invisible"
                size="small"
                leadingVisual={<Octicon name="triangle-down" size={12} aria-hidden="true" />}
            >
                {props.label}
            </Details.Summary>
            <div class="absolute right-0 z-20 mt-2 w-72 rounded-md border border-base-300 bg-base-100 p-4 shadow-xl">
                {props.children}
                <div class="mt-4 flex justify-end gap-2">
                    <Button type="submit" variant="primary" size="small">
                        Apply
                    </Button>
                </div>
            </div>
        </Details>
    );
}

function CountPill(props: { count?: number; pending: boolean }) {
    return (
        <CounterLabel>
            <Show when={!props.pending} fallback={<Spinner size="small" srText={null} />}>
                {formatCount(props.count ?? 0)}
            </Show>
        </CounterLabel>
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
                    <Label>Viewing all</Label>
                </Show>
            </div>

            <div class="flex flex-wrap items-center gap-1 lg:ml-auto">
                <FilterDropdown label="Author">
                    <div class="flex flex-col gap-2">
                        <Label>Filter by author</Label>
                        <TextInput
                            name="author"
                            size="small"
                            value={props.filters.author}
                            placeholder="octocat"
                            autocomplete="off"
                            block
                        />
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Labels">
                    <div class="flex flex-col gap-2">
                        <Label>Filter by labels</Label>
                        <TextInput
                            name="labels"
                            size="small"
                            value={props.filters.labels.join(", ")}
                            placeholder="bug, help wanted"
                            disabled={props.filters.noLabels}
                            block
                        />
                        <label class="flex cursor-pointer items-center gap-2">
                            <Checkbox
                                name="noLabels"
                                checked={props.filters.noLabels}
                            />
                            <span>Unlabeled only</span>
                        </label>
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Projects">
                    <p class="text-sm text-base-content/70">
                        Project filters are not available through GitHub issue
                        search. Use labels, milestones, and assignees instead.
                    </p>
                </FilterDropdown>

                <FilterDropdown label="Milestones">
                    <div class="flex flex-col gap-2">
                        <Label>Filter by milestone</Label>
                        <TextInput
                            name="milestone"
                            size="small"
                            value={props.filters.milestone}
                            placeholder="v1.0"
                            disabled={props.filters.noMilestone}
                            block
                        />
                        <label class="flex cursor-pointer items-center gap-2">
                            <Checkbox
                                name="noMilestone"
                                checked={props.filters.noMilestone}
                            />
                            <span>No milestone</span>
                        </label>
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Assignees">
                    <div class="flex flex-col gap-2">
                        <Label>Filter by assignee</Label>
                        <TextInput
                            name="assignee"
                            size="small"
                            value={props.filters.assignee}
                            placeholder="octocat"
                            autocomplete="off"
                            disabled={props.filters.unassigned}
                            block
                        />
                        <label class="flex cursor-pointer items-center gap-2">
                            <Checkbox
                                name="unassigned"
                                checked={props.filters.unassigned}
                            />
                            <span>Unassigned only</span>
                        </label>
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Types">
                    <Show
                        when={props.pageProps.kind === "pulls"}
                        fallback={
                            <div class="flex flex-col gap-2">
                                <Label>Closed issue reason</Label>
                                <Select
                                    name="reason"
                                    size="small"
                                    value={props.filters.reason}
                                    block
                                >
                                    <For each={REASON_OPTIONS}>
                                        {(option) => (
                                            <Select.Option value={option.value}>
                                                {option.label}
                                            </Select.Option>
                                        )}
                                    </For>
                                </Select>
                            </div>
                        }
                    >
                        <div class="flex flex-col gap-2">
                            <Label>Pull request status</Label>
                            <Select
                                name="draft"
                                size="small"
                                value={props.filters.draft}
                                block
                            >
                                <For each={DRAFT_OPTIONS}>
                                    {(option) => (
                                        <Select.Option value={option.value}>
                                            {option.label}
                                        </Select.Option>
                                    )}
                                </For>
                            </Select>
                            <Select
                                name="review"
                                size="small"
                                value={props.filters.review}
                                block
                            >
                                <For each={REVIEW_OPTIONS}>
                                    {(option) => (
                                        <Select.Option value={option.value}>
                                            {option.label}
                                        </Select.Option>
                                    )}
                                </For>
                            </Select>
                        </div>
                    </Show>
                </FilterDropdown>

                <FilterDropdown
                    label={
                        SORT_OPTIONS.find(
                            (option) => option.value === props.filters.sort,
                        )?.label ?? "Newest"
                    }
                >
                    <div class="flex flex-col gap-2">
                        <Label>Sort by</Label>
                        <Select
                            name="sort"
                            size="small"
                            value={props.filters.sort}
                            block
                        >
                            <For each={SORT_OPTIONS}>
                                {(option) => (
                                    <Select.Option value={option.value}>
                                        {option.label}
                                    </Select.Option>
                                )}
                            </For>
                        </Select>
                    </div>
                </FilterDropdown>

                <Button as="a" href={props.clearHref} variant="invisible" size="small">
                    Reset
                </Button>
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
                        <Button
                            as="a"
                            href={pageHref(props.pageProps, props.filters, 1)}
                            variant="primary"
                            size="small"
                        >
                            Go to first page
                        </Button>
                    </Show>
                    <Button as="a" href={props.clearHref} variant="invisible" size="small">
                        Clear filters
                    </Button>
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
                                        <Spinner size="large" />
                                        <p class="mt-3 font-medium">
                                            Loading {itemNoun(props.kind)}…
                                        </p>
                                    </div>
                                </div>
                            </Match>
                            <Match when={workItemsQuery.isError}>
                                <div class="p-4">
                                    <Flash role="alert" variant="danger">
                                        <div class="flex items-start gap-3">
                                            <Octicon
                                                name="alert"
                                                size={20}
                                                aria-hidden="true"
                                            />
                                            <div>
                                                <h2 class="font-semibold">
                                                    Unable to load {itemNoun(props.kind)}
                                                </h2>
                                                <p class="text-sm">
                                                    {getErrorMessage(
                                                        workItemsQuery.error,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Flash>
                                </div>
                            </Match>
                            <Match when={workItemsQuery.data}>
                                {(result) => (
                                    <>
                                        <Show when={result().incompleteResults}>
                                            <div class="p-4 pb-0">
                                                <Flash role="alert" variant="warning">
                                                    <div class="flex items-center gap-2">
                                                        <Octicon
                                                            name="alert"
                                                            size={18}
                                                            aria-hidden="true"
                                                        />
                                                        <span>
                                                            GitHub returned partial results. Try narrowing
                                                            your filters.
                                                        </span>
                                                    </div>
                                                </Flash>
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
                                        <span class="ml-2 inline-flex"><Spinner size="small" srText={null} /></span>
                                    </Show>
                                </>
                            )}
                        </Show>
                    </p>
                    <div class="flex items-center gap-2">
                        <Show
                            when={hasPrevious()}
                            fallback={
                                <Button type="button" size="small" disabled>
                                    Previous
                                </Button>
                            }
                        >
                            <Button
                                as="a"
                                href={pageHref(
                                    props,
                                    filters(),
                                    filters().page - 1,
                                )}
                                size="small"
                            >
                                Previous
                            </Button>
                        </Show>
                        <Button type="button" variant="invisible" size="small" disabled>
                            Page {filters().page}
                        </Button>
                        <Show
                            when={hasNext()}
                            fallback={
                                <Button type="button" size="small" disabled>
                                    Next
                                </Button>
                            }
                        >
                            <Button
                                as="a"
                                href={pageHref(
                                    props,
                                    filters(),
                                    filters().page + 1,
                                )}
                                size="small"
                            >
                                Next
                            </Button>
                        </Show>
                    </div>
                </div>
            </section>
        </RepoPageLayout>
    );
}

export default RepoWorkItemsPage;
