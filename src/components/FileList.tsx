import { useQuery } from "@tanstack/solid-query";
import { For, Match, Switch } from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";
import Octicon from "./Octicon.tsx";
import {repoHref} from "./RepoNavbar.tsx";

export type FileListProps = {
    contents: any[],
    tree: string,
    repoUrl: string,
};

function FileList(props: FileListProps) {
    console.log(props.tree);
    return (
        <ul class="list">
            <For each={props.contents}>
                {(item) => (
                    <li class="list-row">
                        <a href={props.repoUrl + "/" + "tree" + "/" + props.tree + "/" + item.path} class="flex items-center gap-2">
                            <Switch>
                                <Match when={item.type === "dir"}>
                                    <Octicon name="file-directory" size={16} aria-hidden="true" />
                                </Match>
                                <Match when={item.type === "file"}>
                                    <Octicon name="file" size={16} aria-hidden="true" />
                                </Match>
                            </Switch>
                            {item.name}
                        </a>
                    </li>
                )}
            </For>
        </ul>
    );
}

export default FileList;
