import type { Component } from "solid-js";
import { Show } from "solid-js";
import approx from "approximate-number";
import Octicon from "./Octicon.tsx";
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
        <article class="rounded-md border border-base-content/50 bg-base-100 p-4 min-h-35 flex flex-col justify-between">
            <div>
                <div class="flex items-center gap-3">
                    <Octicon
                        name={props.isFork ? "repo-forked" : "repo"}
                        size={24}
                        class="shrink-0 opacity-80"
                        aria-hidden="true"
                    />
                    <a
                        href={href()}
                        class="font-semibold text-xl link link-hover leading-tight"
                    >
                        {props.owner}/{props.name}
                    </a>
                    <span class="badge badge-outline rounded-full capitalize font-semibold">
                        {visibility()}
                    </span>
                </div>
                <Show when={props.description}>
                    <p class="mt-4 text-lg opacity-80 leading-snug">
                        {props.description}
                    </p>
                </Show>
            </div>

            <div class="mt-12 flex items-center gap-8 text-lg opacity-90">
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
                        <Octicon name="star" size={24} aria-hidden="true" />
                        {approx(props.stars ?? 0)}
                    </span>
                </Show>
                <Show when={(props.forks ?? 0) > 0}>
                    <span class="flex items-center gap-2">
                        <Octicon
                            name="repo-forked"
                            size={24}
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
