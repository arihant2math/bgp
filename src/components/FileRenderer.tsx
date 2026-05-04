import { Button, ButtonGroup, SegmentedControl } from "@primer/solid";
import {
    createEffect,
    createMemo,
    createSignal,
    Match,
    Show,
    Switch,
} from "solid-js";
import CodeRenderer from "./CodeRenderer.tsx";
import MarkdownRenderer from "./MarkdownRenderer.tsx";

export type FileRendererProps = {
    content: string;
    path: string;
    markdownContext?: `${string}/${string}`;
    rawUrl?: string | null;
    htmlUrl?: string | null;
    class?: string;
};

type FileViewMode = "preview" | "code";

function isMarkdownFile(path: string) {
    return (
        /(?:^|\/)(?:readme|license|contributing|code_of_conduct|security|support)(?:\.[^.]+)?$/i.test(
            path,
        ) || /\.(?:md|markdown|mdown|mkdn|mkd)$/i.test(path)
    );
}

function githubRawUrlFromHtmlUrl(htmlUrl?: string | null) {
    if (!htmlUrl) return undefined;

    return htmlUrl
        .replace("https://github.com/", "https://raw.githubusercontent.com/")
        .replace("/blob/", "/");
}

function githubBlameUrlFromHtmlUrl(htmlUrl?: string | null) {
    if (!htmlUrl) return undefined;
    return htmlUrl.replace("/blob/", "/blame/");
}

function downloadTextFile(path: string, content: string) {
    const filename = path.split("/").pop() || "download.txt";
    const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function FileRenderer(props: FileRendererProps) {
    const isMarkdown = createMemo(() => isMarkdownFile(props.path));
    const [activeView, setActiveView] = createSignal<FileViewMode>(
        isMarkdown() ? "preview" : "code",
    );
    const [copyLabel, setCopyLabel] = createSignal("Copy");

    createEffect(() => {
        props.path;
        setActiveView(isMarkdown() ? "preview" : "code");
        setCopyLabel("Copy");
    });

    const rawUrl = createMemo(
        () => props.rawUrl ?? githubRawUrlFromHtmlUrl(props.htmlUrl),
    );
    const blameUrl = createMemo(() => githubBlameUrlFromHtmlUrl(props.htmlUrl));

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(props.content);
            setCopyLabel("Copied");
            window.setTimeout(() => setCopyLabel("Copy"), 1500);
        } catch {
            setCopyLabel("Failed");
            window.setTimeout(() => setCopyLabel("Copy"), 1500);
        }
    }

    return (
        <div
            class={`file-viewer overflow-hidden rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] ${props.class ?? ""}`}
        >
            <div class="file-viewer-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borderColor-default)] px-3 py-2">
                <SegmentedControl
                    aria-label={
                        isMarkdown()
                            ? "Markdown view options"
                            : "File view options"
                    }
                    size="small"
                >
                    <Show when={isMarkdown()}>
                        <SegmentedControl.Button
                            selected={activeView() === "preview"}
                            onClick={() => setActiveView("preview")}
                        >
                            Preview
                        </SegmentedControl.Button>
                    </Show>
                    <SegmentedControl.Button
                        selected={activeView() === "code"}
                        onClick={() => setActiveView("code")}
                    >
                        Code
                    </SegmentedControl.Button>
                    <SegmentedControl.Button
                        selected={false}
                        disabled={!blameUrl()}
                        onClick={() => {
                            const url = blameUrl();
                            if (!url) return;
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                    >
                        Blame
                    </SegmentedControl.Button>
                </SegmentedControl>

                <ButtonGroup aria-label="File actions">
                    <Button
                        type="button"
                        size="small"
                        disabled={!rawUrl()}
                        onClick={() => {
                            const url = rawUrl();
                            if (!url) return;
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                    >
                        Raw
                    </Button>
                    <Button type="button" size="small" onClick={handleCopy}>
                        {copyLabel()}
                    </Button>
                    <Button
                        type="button"
                        size="small"
                        onClick={() =>
                            downloadTextFile(props.path, props.content)
                        }
                    >
                        Download
                    </Button>
                </ButtonGroup>
            </div>

            <Switch>
                <Match when={isMarkdown() && activeView() === "preview"}>
                    <MarkdownRenderer
                        markdown={props.content}
                        context={props.markdownContext}
                        framed={false}
                    />
                </Match>
                <Match when={activeView() === "code" || !isMarkdown()}>
                    <CodeRenderer
                        code={props.content}
                        path={props.path}
                        framed={false}
                    />
                </Match>
            </Switch>
        </div>
    );
}

export default FileRenderer;
