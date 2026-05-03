import {useQuery} from "@tanstack/solid-query";
import {getOctokit, parseRestOctokitResponse} from "../../lib/octokit.ts";
import RepoPageLayout from "../../components/RepoPageLayout.tsx";
import {For, Match, Show, Switch} from "solid-js";
import FileList from "../../components/FileList.tsx";
import FileRenderer from "../../components/FileRenderer.tsx";
import {repoHref} from "../../lib/hrefGen.ts";
import { decodeBase64Content } from "../../lib/content.ts";

export type RepositoryItemProps = {
    profile: string;
    repo: string;
    tree: string;
    path: string[];
};

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

    const readmeQuery = useQuery(() => ({
        queryKey: ["readme", props.profile, props.repo, props.tree, props.path],
        queryFn: () =>
            getOctokit()
                .rest.repos.getReadmeInDirectory({ owner: props.profile, repo: props.repo, dir: props.path.join("/"), ref: props.tree })
                .then((res) => parseRestOctokitResponse(res)),
        enabled: contentsQuery.isSuccess && Array.isArray(contentsQuery.data),
        retry: false,
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
                            <>
                                <FileList contents={contentsQuery.data} tree={props.tree} repoUrl={repoHref(props.profile, props.repo)}/>
                                <Show when={readmeQuery.isSuccess}>
                                    <FileRenderer
                                        content={decodeBase64Content(readmeQuery.data.content)}
                                        path={readmeQuery.data.path}
                                        markdownContext={`${props.profile}/${props.repo}`}
                                        class="mt-4"
                                    />
                                </Show>
                            </>
                        </Match>
                        <Match when={contentsQuery.data.type === "file"}>
                            <FileRenderer
                                content={decodeBase64Content(contentsQuery.data.content)}
                                path={contentsQuery.data.path}
                                markdownContext={`${props.profile}/${props.repo}`}
                            />
                        </Match>
                    </Switch>
                </Match>
            </Switch>
        </RepoPageLayout>
    );
}

export default RepositoryItem;
