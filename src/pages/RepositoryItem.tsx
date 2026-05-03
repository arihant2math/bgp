import {useQuery} from "@tanstack/solid-query";
import {getOctokit, parseRestOctokitResponse} from "../lib/octokit.ts";
import RepoNavbar, {repoHref} from "../components/RepoNavbar.tsx";
import {Match, Switch} from "solid-js";
import FileList from "../components/FileList.tsx";

export type RepositoryItemProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string;
};

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
                            <pre>
                            {atob(contentsQuery.data.content)}
                            </pre>
                        </Match>
                    </Switch>
                </Match>
            </Switch>
        </main>
    );
}

export default RepositoryItem;
