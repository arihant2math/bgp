import { Match, Switch } from "solid-js";
import CodeRenderer from "./CodeRenderer.tsx";
import MarkdownRenderer from "./MarkdownRenderer.tsx";

export type FileRendererProps = {
    content: string;
    path: string;
    markdownContext?: `${string}/${string}`;
    class?: string;
};

function isMarkdownFile(path: string) {
    return /(?:^|\/)(?:readme|license|contributing|code_of_conduct|security|support)(?:\.[^.]+)?$/i.test(path)
        || /\.(?:md|markdown|mdown|mkdn|mkd)$/i.test(path);
}

function FileRenderer(props: FileRendererProps) {
    return (
        <Switch>
            <Match when={isMarkdownFile(props.path)}>
                <MarkdownRenderer
                    markdown={props.content}
                    context={props.markdownContext}
                    class={props.class}
                />
            </Match>
            <Match when={!isMarkdownFile(props.path)}>
                <CodeRenderer
                    code={props.content}
                    path={props.path}
                    class={props.class}
                />
            </Match>
        </Switch>
    );
}

export default FileRenderer;
