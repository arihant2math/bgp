import { useQuery } from "@tanstack/solid-query";
import { For, Match, Switch } from "solid-js";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";
import Octicon from "./Octicon.tsx";

export type FileListProps = {
    profile: string;
    repo: string;
};

function FileList(props: FileListProps) {
    const contentsQuery = useQuery(() => ({
        queryKey: ["contents", props.profile, props.repo],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({ owner: props.profile, repo: props.repo, path: "" })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <Switch>
            <Match when={contentsQuery.isPending}>Loading ...</Match>
            <Match when={contentsQuery.isError}>Error</Match>
            <Match when={contentsQuery.isSuccess}>
                <ul class="list">
                    <For each={contentsQuery.data}>
                        {(item) => (
                            <li class="list-row">
                                <a href="#" class="flex items-center gap-2">
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
            </Match>
        </Switch>
    );
}

export default FileList;
