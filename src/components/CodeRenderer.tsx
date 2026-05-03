import { createMemo, createResource, For, Show } from "solid-js";
import type { BundledTheme } from "shiki";
import { highlightCode } from "../lib/shiki.ts";

export type CodeRendererProps = {
    code: string;
    language?: string;
    path?: string;
    theme?: BundledTheme;
    class?: string;
};
function withLineNumbers(html: string) {
    if (typeof DOMParser === "undefined") return html;

    const document = new DOMParser().parseFromString(html, "text/html");
    const code = document.querySelector("pre > code");

    if (!code) return html;

    const lines = Array.from(code.querySelectorAll(":scope > span.line"));
    if (lines.length === 0) return html;

    const fragment = document.createDocumentFragment();

    for (const [index, line] of lines.entries()) {
        const row = document.createElement("span");
        row.className = "code-line";

        const gutter = document.createElement("span");
        gutter.className = "code-line-number";
        gutter.textContent = String(index + 1);

        const content = document.createElement("span");
        content.className = "code-line-content";
        while (line.firstChild) {
            content.append(line.firstChild);
        }

        if (content.childNodes.length === 0) {
            content.textContent = " ";
        }

        row.append(gutter, content);
        fragment.append(row);
    }

    code.replaceChildren(fragment);
    return document.body.innerHTML;
}

function CodeRenderer(props: CodeRendererProps) {
    const fallbackLines = createMemo(() => props.code.split("\n"));
    const [html] = createResource(
        () => [props.code, props.language, props.path, props.theme] as const,
        async ([code, language, path, theme]) =>
            withLineNumbers(
                await highlightCode(code, language, path, theme),
            ),
    );

    return (
        <div
            class={`code-renderer overflow-hidden rounded-md border border-base-300 bg-base-100 ${props.class ?? ""}`}
        >
            <Show
                when={html()}
                fallback={
                    <pre class="m-0 overflow-x-auto p-4 text-sm leading-6">
                        <code>
                            <For each={fallbackLines()}>
                                {(line, index) => (
                                    <span class="code-line">
                                        <span class="code-line-number">
                                            {index() + 1}
                                        </span>
                                        <span class="code-line-content">
                                            {line.length > 0 ? line : " "}
                                        </span>
                                    </span>
                                )}
                            </For>
                        </code>
                    </pre>
                }
            >
                {(renderedHtml) => (
                    <div class="overflow-x-auto" innerHTML={renderedHtml()} />
                )}
            </Show>
        </div>
    );
}

export default CodeRenderer;
