import { Spinner } from "@primer/solid";
import { useQuery } from "@tanstack/solid-query";
import { Match, Switch } from "solid-js";
import { getOctokit } from "../lib/octokit.ts";

export type MarkdownRendererProps = {
    markdown: string;
    context?: `${string}/${string}`;
    class?: string;
};

async function renderMarkdown(
    markdown: string,
    context?: `${string}/${string}`,
) {
    if (markdown.trim().length === 0) {
        return "";
    }

    const response = await getOctokit().rest.markdown.render({
        text: markdown,
        mode: "gfm",
        ...(context ? { context } : {}),
    });

    return response.data;
}

function MarkdownRenderer(props: MarkdownRendererProps) {
    const htmlQuery = useQuery(() => ({
        queryKey: ["markdown", props.markdown, props.context],
        queryFn: () => renderMarkdown(props.markdown, props.context),
    }));

    return (
        <div
            class={`markdown-renderer rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] ${props.class ?? ""}`}
        >
            <Switch>
                <Match when={htmlQuery.isPending}>
                    <div class="flex items-center gap-3 p-4 text-sm text-[var(--fgColor-muted)]">
                        <Spinner
                            size="small"
                            srText={null}
                            aria-hidden="true"
                        />
                        Rendering markdown…
                    </div>
                </Match>
                <Match when={htmlQuery.isError}>
                    <div class="p-4 text-sm text-[var(--fgColor-danger)]">
                        Could not render markdown from GitHub.
                    </div>
                </Match>
                <Match when={htmlQuery.isSuccess}>
                    <article class="markdown-body" innerHTML={htmlQuery.data} />
                </Match>
            </Switch>
        </div>
    );
}

export default MarkdownRenderer;
