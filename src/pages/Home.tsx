import { useQuery } from "@tanstack/solid-query";
import { getOctokit } from "../lib/octokit.ts";
import { Match, Switch } from "solid-js";

function Home() {
    const query = useQuery(() => ({
        queryKey: ["repoData"],
        queryFn: () =>
            getOctokit()
                .rest.users.getAuthenticated()
                .then((res) => res.data),
    }));

    return (
        <main>
            <Switch>
                <Match when={query.isPending}>Loading...</Match>
                <Match when={query.isError}>Error</Match>
                <Match when={query.isSuccess}>
                    <h1>Hi {query.data.name}!</h1>
                </Match>
            </Switch>
            <a href="/servo/servo">Servo</a>
        </main>
    );
}

export default Home;
