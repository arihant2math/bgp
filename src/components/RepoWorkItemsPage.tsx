import {
    Button,
    ButtonBase,
    Checkbox,
    CounterLabel,
    Flash,
    IssueLabel,
    Label,
    Select,
    Spinner,
    TextInput,
} from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import { useSearchParams } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { For, Match, Show, Switch, createMemo, type JSX } from "solid-js";
import { format } from "timeago.js";
import type {
    IssueReasonFilter,
    PullDraftFilter,
    PullReviewFilter,
    WorkItem,
    WorkItemFilters,
    WorkItemKind,
    WorkItemLabel,
    WorkItemSort,
    WorkItemState,
    WorkItemUser,
} from "../lib/githubWorkItems.ts";
import {
    SEARCH_RESULT_LIMIT,
    WORK_ITEMS_PER_PAGE,
    defaultWorkItemFilters,
    fetchWorkItems,
    normalizeWorkItemFilters,
    workItemFiltersToSearchParams,
} from "../lib/githubWorkItems.ts";
import { repoHref } from "../lib/hrefGen.ts";
import Avatar from "./Avatar.tsx";
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
    if (kind === "pulls" && item.pull_request?.merged_at) return "done";
    if (item.state === "open") return "success";
    if (kind === "issues" && item.state_reason === "not_planned")
        return "danger";
    if (kind === "pulls" && item.draft) return "default";
    return "secondary";
}

function FilterField(props: { label: string; children: JSX.Element }) {
    return (
        <label class="flex flex-col gap-2">
            <span class="text-xs font-semibold uppercase tracking-[0.02em] text-[var(--fgColor-muted)]">
                {props.label}
            </span>
            {props.children}
        </label>
    );
}

function CheckboxRow(props: { name: string; checked: boolean; label: string }) {
    return (
        <label class="inline-flex items-center gap-2 text-sm text-[var(--fgColor-default)]">
            <Checkbox name={props.name} checked={props.checked} />
            <span>{props.label}</span>
        </label>
    );
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

function AssigneeAvatar(props: { assignee: WorkItemUser }) {
    return (
        <div title={props.assignee.login}>
            <Show
                when={props.assignee.avatar_url}
                fallback={
                    <div class="grid size-6 place-items-center rounded-full border border-[var(--borderColor-default)] bg-[var(--bgColor-muted)] ring-2 ring-[var(--bgColor-default)]">
                        <Octicon name="person" size={12} aria-hidden="true" />
                    </div>
                }
            >
                {(avatarUrl) => (
                    <Avatar
                        href={avatarUrl()}
                        size={24}
                        alt={`${props.assignee.login}'s avatar`}
                        class="ring-2 ring-[var(--bgColor-default)]"
                    />
                )}
            </Show>
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
        <li class="flex items-start gap-3 border-b border-[var(--borderColor-muted)] px-4 py-4 last:border-b-0 hover:bg-[var(--bgColor-muted)]">
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
                        class="min-w-0 text-base font-semibold text-[var(--fgColor-default)] hover:text-[var(--fgColor-accent)] hover:underline"
                    >
                        {props.item.title || "Untitled"}
                    </a>
                    <Show when={shouldShowState()}>
                        <Label
                            variant={stateLabelVariant(props.item, props.kind)}
                            size="small"
                        >
                            {stateLabel(props.item, props.kind)}
                        </Label>
                    </Show>
                    <Show when={props.item.locked}>
                        <Label
                            variant="attention"
                            size="small"
                            class="inline-flex items-center gap-1"
                        >
                            <Octicon name="lock" size={12} aria-hidden="true" />
                            Locked
                        </Label>
                    </Show>
                    <For each={props.item.labels}>
                        {(label) => <WorkItemLabelBadge label={label} />}
                    </For>
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[var(--fgColor-muted)]">
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
                                    class="text-[var(--fgColor-accent)] hover:underline"
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

            <div class="hidden min-w-36 shrink-0 items-center justify-end gap-5 pt-1 text-sm text-[var(--fgColor-muted)] md:flex">
                <Show when={props.item.comments > 0}>
                    <div
                        class="inline-flex items-center gap-1"
                        title={`${props.item.comments} comments`}
                    >
                        <Octicon name="comment" size={16} aria-hidden="true" />
                        {formatCount(props.item.comments)}
                    </div>
                </Show>
                <Show when={assignees().length > 0}>
                    <div class="flex items-center -space-x-2">
                        <For each={assignees().slice(0, 3)}>
                            {(assignee) => (
                                <AssigneeAvatar assignee={assignee} />
                            )}
                        </For>
                        <Show when={assignees().length > 3}>
                            <div class="grid size-6 place-items-center rounded-full border border-[var(--borderColor-default)] bg-[var(--bgColor-muted)] text-[10px] font-medium ring-2 ring-[var(--bgColor-default)]">
                                +{assignees().length - 3}
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
                <span class="text-sm text-[var(--fgColor-muted)]">Filters</span>
                <For each={props.chips}>
                    {(chip) => (
                        <Label
                            as="a"
                            href={chip.href}
                            variant="default"
                            class="inline-flex items-center gap-1 no-underline hover:opacity-80"
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
            <div class="flex min-w-0 flex-1 items-stretch rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] shadow-sm">
                <div class="flex min-w-0 flex-1 items-center gap-2 px-3">
                    <Label variant="accent" size="small">
                        {qualifier()}
                    </Label>
                    <Label variant="accent" size="small">
                        {stateQualifier()}
                    </Label>
                    <input
                        name="q"
                        type="search"
                        class="min-w-24 grow border-0 bg-transparent py-2 text-sm outline-none placeholder:text-[var(--fgColor-muted)]"
                        value={props.filters.q}
                        placeholder={`Search ${itemNoun(props.pageProps.kind)}`}
                        autocomplete="off"
                    />
                </div>
                <Button
                    icon={
                        <Octicon name="search" size={18} aria-hidden="true" />
                    }
                    type="submit"
                    aria-label={`Search ${itemNoun(props.pageProps.kind)}`}
                />
            </div>

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

function FilterDropdown(props: { label: string; children: JSX.Element }) {
    return (
        <details class="relative">
            <ButtonBase
                as="summary"
                variant="invisible"
                size="small"
                class="list-none [&::-webkit-details-marker]:hidden"
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
            <div class="absolute right-0 z-20 mt-2 w-72 rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-4 shadow-lg">
                {props.children}
                <div class="mt-4 flex justify-end gap-2">
                    <Button type="submit" variant="primary" size="small">
                        Apply
                    </Button>
                </div>
            </div>
        </details>
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
            ? "font-semibold text-[var(--fgColor-default)]"
            : "font-medium text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]";

    return (
        <div class="flex flex-col gap-3 border-b border-[var(--borderColor-muted)] bg-[var(--bgColor-muted)] px-4 py-3 lg:flex-row lg:items-center">
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
                        class="text-[var(--fgColor-success)]"
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
                        class="text-[var(--fgColor-muted)]"
                        aria-hidden="true"
                    />
                    Closed
                    <CountPill
                        count={props.closedCount}
                        pending={props.closedPending}
                    />
                </a>
                <Show when={props.filters.state === "all"}>
                    <Label variant="default" size="small">
                        Viewing all
                    </Label>
                </Show>
            </div>

            <div class="flex flex-wrap items-center gap-1 lg:ml-auto">
                <FilterDropdown label="Author">
                    <FilterField label="Filter by author">
                        <TextInput
                            name="author"
                            size="small"
                            block
                            value={props.filters.author}
                            placeholder="octocat"
                            autocomplete="off"
                        />
                    </FilterField>
                </FilterDropdown>

                <FilterDropdown label="Labels">
                    <div class="space-y-3">
                        <FilterField label="Filter by labels">
                            <TextInput
                                name="labels"
                                size="small"
                                block
                                value={props.filters.labels.join(", ")}
                                placeholder="bug, help wanted"
                                disabled={props.filters.noLabels}
                            />
                        </FilterField>
                        <CheckboxRow
                            name="noLabels"
                            checked={props.filters.noLabels}
                            label="Unlabeled only"
                        />
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Projects">
                    <p class="text-sm text-[var(--fgColor-muted)]">
                        Project filters are not available through GitHub issue
                        search. Use labels, milestones, and assignees instead.
                    </p>
                </FilterDropdown>

                <FilterDropdown label="Milestones">
                    <div class="space-y-3">
                        <FilterField label="Filter by milestone">
                            <TextInput
                                name="milestone"
                                size="small"
                                block
                                value={props.filters.milestone}
                                placeholder="v1.0"
                                autocomplete="off"
                                disabled={props.filters.noMilestone}
                            />
                        </FilterField>
                        <CheckboxRow
                            name="noMilestone"
                            checked={props.filters.noMilestone}
                            label="No milestone"
                        />
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Assignees">
                    <div class="space-y-3">
                        <FilterField label="Filter by assignee">
                            <TextInput
                                name="assignee"
                                size="small"
                                block
                                value={props.filters.assignee}
                                placeholder="octocat"
                                autocomplete="off"
                                disabled={props.filters.unassigned}
                            />
                        </FilterField>
                        <CheckboxRow
                            name="unassigned"
                            checked={props.filters.unassigned}
                            label="Unassigned only"
                        />
                    </div>
                </FilterDropdown>

                <FilterDropdown label="Types">
                    <Show
                        when={props.pageProps.kind === "pulls"}
                        fallback={
                            <FilterField label="Closed issue reason">
                                <Select
                                    name="reason"
                                    size="small"
                                    block
                                    value={props.filters.reason}
                                >
                                    <For each={REASON_OPTIONS}>
                                        {(option) => (
                                            <option value={option.value}>
                                                {option.label}
                                            </option>
                                        )}
                                    </For>
                                </Select>
                            </FilterField>
                        }
                    >
                        <div class="space-y-3">
                            <FilterField label="Pull request status">
                                <Select
                                    name="draft"
                                    size="small"
                                    block
                                    value={props.filters.draft}
                                >
                                    <For each={DRAFT_OPTIONS}>
                                        {(option) => (
                                            <option value={option.value}>
                                                {option.label}
                                            </option>
                                        )}
                                    </For>
                                </Select>
                            </FilterField>
                            <FilterField label="Review state">
                                <Select
                                    name="review"
                                    size="small"
                                    block
                                    value={props.filters.review}
                                >
                                    <For each={REVIEW_OPTIONS}>
                                        {(option) => (
                                            <option value={option.value}>
                                                {option.label}
                                            </option>
                                        )}
                                    </For>
                                </Select>
                            </FilterField>
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
                    <FilterField label="Sort by">
                        <Select
                            name="sort"
                            size="small"
                            block
                            value={props.filters.sort}
                        >
                            <For each={SORT_OPTIONS}>
                                {(option) => (
                                    <option value={option.value}>
                                        {option.label}
                                    </option>
                                )}
                            </For>
                        </Select>
                    </FilterField>
                </FilterDropdown>

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
                        variant="invisible"
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

                    <div class="overflow-visible rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] shadow-sm">
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
                                                        results. Try narrowing
                                                        your filters.
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
                                                    totalCount={
                                                        result().totalCount
                                                    }
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
                </form>

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
                    <div class="flex items-center gap-2">
                        <Show
                            when={hasPrevious()}
                            fallback={<Button disabled>Previous</Button>}
                        >
                            <Button
                                as="a"
                                href={pageHref(
                                    props,
                                    filters(),
                                    filters().page - 1,
                                )}
                            >
                                Previous
                            </Button>
                        </Show>
                        <Label variant="secondary">Page {filters().page}</Label>
                        <Show
                            when={hasNext()}
                            fallback={<Button disabled>Next</Button>}
                        >
                            <Button
                                as="a"
                                href={pageHref(
                                    props,
                                    filters(),
                                    filters().page + 1,
                                )}
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
