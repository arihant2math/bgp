import { getOctokit, parseRestOctokitResponse } from "./octokit.ts";

export type WorkItemKind = "issues" | "pulls";
export type WorkItemState = "open" | "closed" | "all";
export type WorkItemSort =
    | "newest"
    | "oldest"
    | "recently-updated"
    | "least-recently-updated"
    | "most-commented"
    | "least-commented"
    | "most-reacted"
    | "relevance";
export type PullDraftFilter = "all" | "draft" | "ready";
export type PullReviewFilter =
    | "all"
    | "required"
    | "approved"
    | "changes-requested";
export type IssueReasonFilter = "all" | "completed" | "not-planned";

export type WorkItemLabel = {
    id?: number;
    name: string;
    color?: string | null;
    description?: string | null;
};

export type WorkItemUser = {
    login: string;
    avatar_url?: string | null;
    html_url?: string | null;
};

export type WorkItemMilestone = {
    number?: number;
    title: string;
    state?: string;
};

export type WorkItemPullRequest = {
    html_url?: string | null;
    merged_at?: string | null;
};

export type WorkItem = {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: "open" | "closed";
    state_reason?: string | null;
    draft?: boolean;
    locked?: boolean;
    comments: number;
    created_at: string;
    updated_at: string;
    closed_at?: string | null;
    user?: WorkItemUser | null;
    assignees?: WorkItemUser[] | null;
    labels: WorkItemLabel[];
    milestone?: WorkItemMilestone | null;
    pull_request?: WorkItemPullRequest;
};

export type WorkItemFilters = {
    q: string;
    state: WorkItemState;
    sort: WorkItemSort;
    labels: string[];
    noLabels: boolean;
    author: string;
    assignee: string;
    unassigned: boolean;
    milestone: string;
    noMilestone: boolean;
    draft: PullDraftFilter;
    review: PullReviewFilter;
    reason: IssueReasonFilter;
    page: number;
};

export type WorkItemsResult = {
    items: WorkItem[];
    totalCount: number;
    incompleteResults: boolean;
    query: string;
};

export const WORK_ITEMS_PER_PAGE = 25;
export const SEARCH_RESULT_LIMIT = 1000;

const VALID_STATES: WorkItemState[] = ["open", "closed", "all"];
const VALID_SORTS: WorkItemSort[] = [
    "newest",
    "oldest",
    "recently-updated",
    "least-recently-updated",
    "most-commented",
    "least-commented",
    "most-reacted",
    "relevance",
];
const VALID_DRAFTS: PullDraftFilter[] = ["all", "draft", "ready"];
const VALID_REVIEWS: PullReviewFilter[] = [
    "all",
    "required",
    "approved",
    "changes-requested",
];
const VALID_REASONS: IssueReasonFilter[] = ["all", "completed", "not-planned"];

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(
    value: string | string[] | undefined,
    valid: readonly T[],
    fallback: T,
) {
    const candidate = firstParam(value);
    return valid.includes(candidate as T) ? (candidate as T) : fallback;
}

function cleanText(value: string | string[] | undefined) {
    return (firstParam(value) ?? "").trim();
}

function stripLoginPrefix(value: string) {
    return value.trim().replace(/^@+/, "");
}

function parseBoolean(value: string | string[] | undefined) {
    return ["1", "true", "yes", "on"].includes(
        (firstParam(value) ?? "").toLowerCase(),
    );
}

function parsePositivePage(value: string | string[] | undefined) {
    const page = Number.parseInt(firstParam(value) ?? "1", 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseLabels(value: string | string[] | undefined) {
    const values = Array.isArray(value) ? value : [value ?? ""];
    const labels = values.flatMap((entry) =>
        entry.includes("\n") ? entry.split(/\r?\n/g) : entry.split(","),
    );

    return Array.from(
        new Set(labels.map((label) => label.trim()).filter(Boolean)),
    );
}

export function defaultWorkItemFilters(kind: WorkItemKind): WorkItemFilters {
    return {
        q: "",
        state: "open",
        sort: "newest",
        labels: [],
        noLabels: false,
        author: "",
        assignee: "",
        unassigned: false,
        milestone: "",
        noMilestone: false,
        draft: kind === "pulls" ? "all" : "all",
        review: "all",
        reason: "all",
        page: 1,
    };
}

export function normalizeWorkItemFilters(
    params: Partial<
        Record<keyof WorkItemFilters, string | string[] | undefined>
    >,
    kind: WorkItemKind,
): WorkItemFilters {
    const defaults = defaultWorkItemFilters(kind);
    const noLabels = parseBoolean(params.noLabels);
    const unassigned = parseBoolean(params.unassigned);
    const noMilestone = parseBoolean(params.noMilestone);

    return {
        q: cleanText(params.q),
        state: oneOf(params.state, VALID_STATES, defaults.state),
        sort: oneOf(params.sort, VALID_SORTS, defaults.sort),
        labels: noLabels ? [] : parseLabels(params.labels),
        noLabels,
        author: stripLoginPrefix(cleanText(params.author)),
        assignee: unassigned
            ? ""
            : stripLoginPrefix(cleanText(params.assignee)),
        unassigned,
        milestone: noMilestone ? "" : cleanText(params.milestone),
        noMilestone,
        draft: oneOf(params.draft, VALID_DRAFTS, defaults.draft),
        review: oneOf(params.review, VALID_REVIEWS, defaults.review),
        reason: oneOf(params.reason, VALID_REASONS, defaults.reason),
        page: parsePositivePage(params.page),
    };
}

export function workItemFiltersToSearchParams(filters: WorkItemFilters) {
    return {
        q: filters.q || undefined,
        state: filters.state === "open" ? undefined : filters.state,
        sort: filters.sort === "newest" ? undefined : filters.sort,
        labels:
            filters.labels.length > 0 ? filters.labels.join(",") : undefined,
        noLabels: filters.noLabels ? "1" : undefined,
        author: filters.author || undefined,
        assignee: filters.assignee || undefined,
        unassigned: filters.unassigned ? "1" : undefined,
        milestone: filters.milestone || undefined,
        noMilestone: filters.noMilestone ? "1" : undefined,
        draft: filters.draft === "all" ? undefined : filters.draft,
        review: filters.review === "all" ? undefined : filters.review,
        reason: filters.reason === "all" ? undefined : filters.reason,
        page: filters.page > 1 ? String(filters.page) : undefined,
    };
}

function quoteQualifierValue(value: string) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function sortAndOrder(sort: WorkItemSort): {
    sort?: string;
    order?: "asc" | "desc";
} {
    switch (sort) {
        case "oldest":
            return { sort: "created", order: "asc" };
        case "recently-updated":
            return { sort: "updated", order: "desc" };
        case "least-recently-updated":
            return { sort: "updated", order: "asc" };
        case "most-commented":
            return { sort: "comments", order: "desc" };
        case "least-commented":
            return { sort: "comments", order: "asc" };
        case "most-reacted":
            return { sort: "reactions", order: "desc" };
        case "relevance":
            return {};
        case "newest":
            return { sort: "created", order: "desc" };
    }
}

export function buildWorkItemsSearchQuery(args: {
    owner: string;
    repo: string;
    kind: WorkItemKind;
    filters: WorkItemFilters;
}) {
    const terms = [
        `repo:${args.owner}/${args.repo}`,
        args.kind === "issues" ? "is:issue" : "is:pr",
    ];

    const filters = args.filters;
    if (filters.q) terms.push(filters.q);
    if (filters.state !== "all") terms.push(`state:${filters.state}`);
    if (filters.noLabels) terms.push("no:label");
    else {
        for (const label of filters.labels) {
            terms.push(`label:${quoteQualifierValue(label)}`);
        }
    }
    if (filters.author) terms.push(`author:${filters.author}`);
    if (filters.unassigned) terms.push("no:assignee");
    else if (filters.assignee) terms.push(`assignee:${filters.assignee}`);
    if (filters.noMilestone) terms.push("no:milestone");
    else if (filters.milestone) {
        terms.push(`milestone:${quoteQualifierValue(filters.milestone)}`);
    }

    if (args.kind === "pulls") {
        if (filters.draft === "draft") terms.push("draft:true");
        if (filters.draft === "ready") terms.push("draft:false");
        if (filters.review !== "all") {
            const value =
                filters.review === "changes-requested"
                    ? "changes_requested"
                    : filters.review;
            terms.push(`review:${value}`);
        }
    } else if (filters.reason !== "all") {
        const value =
            filters.reason === "not-planned" ? "not planned" : "completed";
        terms.push(`reason:${quoteQualifierValue(value)}`);
    }

    return terms.join(" ");
}

function normalizeLabels(
    labels: Array<string | WorkItemLabel | null | undefined> | undefined,
) {
    return (labels ?? []).flatMap((label) => {
        if (!label) return [];
        if (typeof label === "string") return label ? [{ name: label }] : [];
        return label.name ? [label] : [];
    });
}

export async function fetchWorkItems(args: {
    owner: string;
    repo: string;
    kind: WorkItemKind;
    filters: WorkItemFilters;
    perPage?: number;
}): Promise<WorkItemsResult> {
    const query = buildWorkItemsSearchQuery({
        owner: args.owner,
        repo: args.repo,
        kind: args.kind,
        filters: args.filters,
    });
    const sorting = sortAndOrder(args.filters.sort);
    const request: Record<string, unknown> = {
        q: query,
        per_page: args.perPage ?? WORK_ITEMS_PER_PAGE,
        page: args.filters.page,
    };

    if (sorting.sort) request.sort = sorting.sort;
    if (sorting.order) request.order = sorting.order;

    const data = (await getOctokit()
        .rest.search.issuesAndPullRequests(request as never)
        .then((res) => parseRestOctokitResponse(res))) as {
        total_count?: number;
        incomplete_results?: boolean;
        items?: WorkItem[];
    };

    return {
        items: (data.items ?? []).map((item) => ({
            ...item,
            labels: normalizeLabels(item.labels),
        })),
        totalCount: data.total_count ?? 0,
        incompleteResults: Boolean(data.incomplete_results),
        query,
    };
}
