import { useQuery } from "@tanstack/solid-query";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";
import { Match, Switch } from "solid-js";
import { profileHref, repoHref } from "../lib/hrefGen.ts";

function Home() {
    const query = useQuery(() => ({
        queryKey: ["repoData"],
        queryFn: () =>
            getOctokit()
                .rest.users.getAuthenticated()
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <main class="flex-col mx-auto">
            <Switch>
                <Match when={query.isPending}>Loading...</Match>
                <Match when={query.isError}>Error</Match>
                <Match when={query.isSuccess}>
                    <div class="flex flex-col items-center gap-2">
                        <h1 class="text-2xl">Hi {query.data.name}!</h1>
                        <span>
                            Your Profile:{" "}
                            <a href={profileHref(query.data.login)}>
                                {query.data.login}
                            </a>
                        </span>
                        <span>
                            Demo: <a href={repoHref("servo", "servo")}>Servo</a>
                        </span>
                    </div>
                </Match>
            </Switch>
        </main>
    );
}

export default Home;
