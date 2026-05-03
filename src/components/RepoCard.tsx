import type { Component } from "solid-js";
import { Show } from "solid-js";
import { Card, Label, Link } from "../vendor/primer-solid";
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
        <Card class="min-h-35">
            <div class="flex h-full flex-col justify-between gap-6">
                <div>
                    <div class="flex items-center gap-3">
                        <Octicon
                            name={props.isFork ? "repo-forked" : "repo"}
                            size={16}
                            class="shrink-0 opacity-80"
                            aria-hidden="true"
                        />
                        <Link href={href()} class="font-semibold text-md leading-tight">
                            {props.owner}/{props.name}
                        </Link>
                        <Label>{visibility()}</Label>
                    </div>
                    <Show when={props.description}>
                        <p class="mt-4 text-sm opacity-80 leading-snug">
                            {props.description}
                        </p>
                    </Show>
                </div>

                <div class="flex items-center gap-8 text-md opacity-90">
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
            </div>
        </Card>
    );
};

export default RepoCard;
