import { createResource, Show } from "solid-js";
import { bundledLanguagesInfo, createHighlighter } from "shiki";
import type { BundledLanguage, BundledTheme } from "shiki";

export type CodeRendererProps = {
    code: string;
    language?: string;
    path?: string;
    theme?: BundledTheme;
    class?: string;
};

const defaultTheme: BundledTheme = "github-light";
const defaultDarkTheme: BundledTheme = "github-dark";
let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function getHighlighter() {
    highlighterPromise ??= createHighlighter({
        themes: [defaultTheme, defaultDarkTheme],
        langs: ["text"],
    });

    return highlighterPromise;
}

const filenameLanguages: Record<string, string> = {
    dockerfile: "dockerfile",
    makefile: "makefile",
    "package.json": "json",
    "tsconfig.json": "jsonc",
    "vite.config.ts": "ts",
    "vite.config.js": "js",
};

const extensionLanguages: Record<string, string> = {
    cjs: "js",
    h: "c",
    hpp: "cpp",
    htm: "html",
    js: "javascript",
    jsx: "jsx",
    mjs: "js",
    py: "python",
    rb: "ruby",
    rs: "rust",
    ts: "typescript",
    tsx: "tsx",
    yml: "yaml",
};

function isBundledLanguage(language: string): language is BundledLanguage {
    return bundledLanguagesInfo.some(
        (info) => info.id === language || info.aliases?.includes(language),
    );
}

function inferLanguage(path?: string) {
    if (!path) return "text";

    const filename = path.split("/").pop()?.toLowerCase() ?? "";
    const extension = filename.includes(".")
        ? filename.split(".").pop()
        : undefined;

    return (
        filenameLanguages[filename] ??
        (extension ? (extensionLanguages[extension] ?? extension) : "text")
    );
}

async function renderCode(
    code: string,
    language?: string,
    path?: string,
    theme?: BundledTheme,
) {
    const requestedLanguage = (language ?? inferLanguage(path)).toLowerCase();
    const shikiLanguage = isBundledLanguage(requestedLanguage)
        ? requestedLanguage
        : "text";
    const highlighter = await getHighlighter();

    if (shikiLanguage !== "text") {
        await highlighter.loadLanguage(shikiLanguage);
    }

    if (theme && theme !== defaultTheme && theme !== defaultDarkTheme) {
        await highlighter.loadTheme(theme);
    }

    return highlighter.codeToHtml(
        code,
        theme
            ? {
                  lang: shikiLanguage,
                  theme,
              }
            : {
                  lang: shikiLanguage,
                  themes: {
                      light: defaultTheme,
                      dark: defaultDarkTheme,
                  },
                  defaultColor: "light",
              },
    );
}

function CodeRenderer(props: CodeRendererProps) {
    const [html] = createResource(
        () => [props.code, props.language, props.path, props.theme] as const,
        ([code, language, path, theme]) =>
            renderCode(code, language, path, theme),
    );

    return (
        <div
            class={`code-renderer overflow-hidden rounded-md border border-base-300 bg-base-100 ${props.class ?? ""}`}
        >
            <Show
                when={html()}
                fallback={
                    <pre class="m-0 overflow-x-auto p-4 text-sm leading-6">
                        <code>{props.code}</code>
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
