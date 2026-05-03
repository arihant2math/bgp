import {useQuery} from "@tanstack/solid-query";
import {getOctokit, parseRestOctokitResponse} from "../lib/octokit.ts";
import RepoNavbar, {repoHref} from "../components/RepoNavbar.tsx";
import {Match, Switch} from "solid-js";
import FileList from "../components/FileList.tsx";
import CodeRenderer from "../components/CodeRenderer.tsx";

export type RepositoryItemProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string;
};

function decodeBase64Content(content: string) {
    const binary = atob(content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
}

function RepositoryItem(props: RepositoryItemProps) {
    // TODO: Standardize contents queries
    const contentsQuery = useQuery(() => ({
        queryKey: ["tree", props.profile, props.repo, props.tree, props.path],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({ owner: props.profile, repo: props.repo, path: props.path, ref: props.tree })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <main>
            <RepoNavbar
                profile={props.profile}
                repo={props.repo}
                active="code"
            />
            <Switch>
                <Match when={contentsQuery.isPending}>Loading ...</Match>
                <Match when={contentsQuery.isError}>Error</Match>
                <Match when={contentsQuery.isSuccess}>
                    <Switch>
                        <Match when={Array.isArray(contentsQuery.data)}>
                            <FileList contents={contentsQuery.data} tree={props.tree} repoUrl={repoHref(props.profile, props.repo)}/>
                        </Match>
                        <Match when={contentsQuery.data.type === "file"}>
                            <div class="mx-8 my-4">
                                <CodeRenderer
                                    code={decodeBase64Content(contentsQuery.data.content)}
                                    path={contentsQuery.data.path}
                                />
                            </div>
                        </Match>
                    </Switch>
                </Match>
            </Switch>
        </main>
    );
}

export default RepositoryItem;
