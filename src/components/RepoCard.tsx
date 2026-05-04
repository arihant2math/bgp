import { Label } from "@primer/solid";
import { Octicon } from "@primer/solid/octicon";
import approx from "approximate-number";
import { Show, type Component } from "solid-js";
import { repoHref } from "../lib/hrefGen.ts";

export type RepoCardProps = {
    owner: string;
    name: string;
    description?: string | null;
    visibility?: string;
    language?: string | null;
    stars?: number;
    forks?: number;
    isFork?: boolean;
    href?: string;
};

const RepoCard: Component<RepoCardProps> = (props) => {
    const href = () => props.href ?? repoHref(props.owner, props.name);
    const visibility = () => props.visibility ?? "public";

    return (
        <article class="flex min-h-35 flex-col justify-between rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-4">
            <div>
                <div class="flex items-center gap-3">
                    <Octicon
                        name={props.isFork ? "repo-forked" : "repo"}
                        size={16}
                        class="shrink-0 opacity-80"
                        aria-hidden="true"
                    />
                    <a
                        href={href()}
                        class="text-md leading-tight font-semibold text-[var(--fgColor-accent)] hover:underline"
                    >
                        {props.owner}/{props.name}
                    </a>
                    <Label variant="secondary" size="small">
                        {visibility()}
                    </Label>
                </div>
                <Show when={props.description}>
                    <p class="mt-4 text-sm leading-snug text-[var(--fgColor-muted)]">
                        {props.description}
                    </p>
                </Show>
            </div>

            <div class="mt-6 flex items-center gap-8 text-md opacity-90">
                <Show when={props.language}>
                    <span class="flex items-center gap-2">
                        <span
                            class="size-4 rounded-full border border-current opacity-60"
                            aria-hidden="true"
                        />
                        {props.language}
                    </span>
                </Show>
                <Show when={(props.stars ?? 0) > 0}>
                    <span class="flex items-center gap-2">
                        <Octicon name="star" size={16} aria-hidden="true" />
                        {approx(props.stars ?? 0)}
                    </span>
                </Show>
                <Show when={(props.forks ?? 0) > 0}>
                    <span class="flex items-center gap-2">
                        <Octicon
                            name="repo-forked"
                            size={16}
                            aria-hidden="true"
                        />
                        {approx(props.forks ?? 0)}
                    </span>
                </Show>
            </div>
        </article>
    );
};

export default RepoCard;
