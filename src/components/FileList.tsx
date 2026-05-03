import { createMemo, For, Match, Switch } from "solid-js";
import Octicon from "./Octicon.tsx";

export type FileListProps = {
    contents: any[],
    tree: string,
    repoUrl: string,
};

function FileList(props: FileListProps) {
    const sortedContents = createMemo(() =>
        [...props.contents].sort((a, b) => {
            const aIsDir = a.type === "dir";
            const bIsDir = b.type === "dir";

            if (aIsDir === bIsDir) return 0;
            return aIsDir ? -1 : 1;
        }),
    );

    return (
        <ul class="list rounded-md border border-base-300 bg-base-100">
            <For each={sortedContents()}>
                {(item) => (
                    <li class="list-row">
                        <a href={props.repoUrl + "/" + "tree" + "/" + props.tree + "/" + item.path} class="flex items-center gap-2">
                            <Octicon name={item.type === "dir" ? "file-directory-fill" : "file"} size={16} aria-hidden="true"
                                class="stroke-neutral-content fill-neutral-content"
                            />
                            {item.name}
                        </a>
                    </li>
                )}
            </For>
        </ul>
    );
}

export default FileList;
