import { useQuery } from "@tanstack/solid-query";
import { Spinner } from "../vendor/primer-solid";
import { Match, Switch } from "solid-js";
import { getOctokit } from "../lib/octokit.ts";
import { highlightMarkdownHtml } from "../lib/shiki.ts";

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

    return highlightMarkdownHtml(response.data);
}

function MarkdownRenderer(props: MarkdownRendererProps) {
    const htmlQuery = useQuery(() => ({
        queryKey: ["markdown", props.markdown, props.context],
        queryFn: () => renderMarkdown(props.markdown, props.context),
    }));

    return (
        <div
            class={`markdown-renderer rounded-md border border-base-300 bg-base-100 ${props.class ?? ""}`}
        >
            <Switch>
                <Match when={htmlQuery.isPending}>
                    <div class="flex items-center gap-3 p-4 text-sm text-base-content/70">
                        <Spinner size="small" srText={null} />
                        Rendering markdown…
                    </div>
                </Match>
                <Match when={htmlQuery.isError}>
                    <div class="p-4 text-sm text-error">
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
