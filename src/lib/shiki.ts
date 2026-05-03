import { bundledLanguagesInfo, createHighlighter } from "shiki";
import type { BundledLanguage, BundledTheme } from "shiki";

export const githubLightTheme: BundledTheme = "github-light";
export const githubDarkTheme: BundledTheme = "github-dark";

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function getHighlighter() {
    highlighterPromise ??= createHighlighter({
        themes: [githubLightTheme, githubDarkTheme],
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

export function inferLanguage(path?: string) {
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

async function ensureLanguage(language: string) {
    const requestedLanguage = language.toLowerCase();
    const shikiLanguage = isBundledLanguage(requestedLanguage)
        ? requestedLanguage
        : "text";
    const highlighter = await getHighlighter();

    if (shikiLanguage !== "text") {
        await highlighter.loadLanguage(shikiLanguage);
    }

    return { highlighter, shikiLanguage };
}

export async function highlightCode(
    code: string,
    language?: string,
    path?: string,
    theme?: BundledTheme,
) {
    const { highlighter, shikiLanguage } = await ensureLanguage(
        language ?? inferLanguage(path),
    );

    if (theme && theme !== githubLightTheme && theme !== githubDarkTheme) {
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
                      light: githubLightTheme,
                      dark: githubDarkTheme,
                  },
                  defaultColor: "light",
              },
    );
}

function extractFenceLanguage(codeElement: HTMLElement) {
    const classNames = codeElement.className.split(/\s+/);

    for (const className of classNames) {
        const language = className.match(/^(?:language|lang)-(.+)$/)?.[1];
        if (language) return language;
    }

    return undefined;
}

export async function highlightMarkdownHtml(html: string) {
    if (typeof DOMParser === "undefined") {
        return html;
    }

    const document = new DOMParser().parseFromString(html, "text/html");
    const blocks = Array.from(document.querySelectorAll("pre > code"));

    await Promise.all(
        blocks.map(async (codeElement) => {
            const preElement = codeElement.parentElement;
            if (!preElement) return;

            const highlighted = await highlightCode(
                codeElement.textContent ?? "",
                extractFenceLanguage(codeElement),
            );
            preElement.outerHTML = highlighted;
        }),
    );

    return document.body.innerHTML;
}
