import { Card, Heading, Label, Link, Text } from "@primer/solid";
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
        <Card class="min-h-35">
            <div class="flex h-full flex-col justify-between">
                <div>
                    <div class="flex items-center gap-3">
                        <Octicon
                            name={props.isFork ? "repo-forked" : "repo"}
                            size={16}
                            class="shrink-0 opacity-80"
                            aria-hidden="true"
                        />
                        <Heading as="h3" size="small">
                            <Link href={href()}>
                                {props.owner}/{props.name}
                            </Link>
                        </Heading>
                        <Label variant="secondary" size="small">
                            {visibility()}
                        </Label>
                    </div>
                    <Show when={props.description}>
                        <Text
                            as="p"
                            size="small"
                            style={{
                                color: "var(--fgColor-muted)",
                                "margin-top": "1rem",
                                "line-height": "1.4",
                            }}
                        >
                            {props.description}
                        </Text>
                    </Show>
                </div>

                <div class="mt-6 flex items-center gap-8 opacity-90">
                    <Show when={props.language}>
                        <Text as="span" class="flex items-center gap-2">
                            <span
                                class="size-3 rounded-full border border-current opacity-60"
                                aria-hidden="true"
                            />
                            {props.language}
                        </Text>
                    </Show>
                    <Show when={(props.stars ?? 0) > 0}>
                        <Text as="span" class="flex items-center gap-2">
                            <Octicon name="star" size={16} aria-hidden="true" />
                            {approx(props.stars ?? 0)}
                        </Text>
                    </Show>
                    <Show when={(props.forks ?? 0) > 0}>
                        <Text as="span" class="flex items-center gap-2">
                            <Octicon
                                name="repo-forked"
                                size={16}
                                aria-hidden="true"
                            />
                            {approx(props.forks ?? 0)}
                        </Text>
                    </Show>
                </div>
            </div>
        </Card>
    );
};

export default RepoCard;
