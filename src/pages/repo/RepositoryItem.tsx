import {useQuery} from "@tanstack/solid-query";
import {getOctokit, parseRestOctokitResponse} from "../../lib/octokit.ts";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import {For, Match, Switch} from "solid-js";
import FileList from "../../components/FileList.tsx";
import CodeRenderer from "../../components/CodeRenderer.tsx";
import {repoHref} from "../../lib/hrefGen.ts";

export type RepositoryItemProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string[];
};

function decodeBase64Content(content: string) {
    const binary = atob(content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
}

function RepositoryItem(props: RepositoryItemProps) {
    // TODO: Standardize contents queries
    console.log(props);
    const contentsQuery = useQuery(() => ({
        queryKey: ["tree", props.profile, props.repo, props.tree, props.path],
        queryFn: () =>
            getOctokit()
                .rest.repos.getContent({ owner: props.profile, repo: props.repo, path: props.path.join("/"), ref: props.tree })
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="code">
            <div class="breadcrumbs text-sm">
                <ul>
                    <li><a href={repoHref(props.profile, props.repo) + "/tree/" + props.tree}>{props.repo}</a></li>
                    <For each={props.path}>
                        {(segment, index) => (
                            <Switch>
                                <Match when={index() === (props.path.length - 1)}>
                                    <li>{segment}</li>
                                </Match>
                                <Match when={index() < (props.path.length - 1)}>
                                    <li>
                                        <a href={repoHref(props.profile, props.repo) + "/tree/" + props.tree + "/" + props.path.slice(0, index() + 1).join("/")}>
                                            {segment}
                                        </a>
                                    </li>
                                </Match>
                            </Switch>
                        )}
                    </For>
                </ul>
            </div>
            <Switch>
                <Match when={contentsQuery.isPending}>Loading ...</Match>
                <Match when={contentsQuery.isError}>Error</Match>
                <Match when={contentsQuery.isSuccess}>
                    <Switch>
                        <Match when={Array.isArray(contentsQuery.data)}>
                            <FileList contents={contentsQuery.data} tree={props.tree} repoUrl={repoHref(props.profile, props.repo)}/>
                        </Match>
                        <Match when={contentsQuery.data.type === "file"}>
                            <div>
                                <CodeRenderer
                                    code={decodeBase64Content(contentsQuery.data.content)}
                                    path={contentsQuery.data.path}
                                />
                            </div>
                        </Match>
                    </Switch>
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default RepositoryItem;
