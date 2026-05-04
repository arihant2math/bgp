import { Heading, Link, Stack, Text } from "@primer/solid";
import { useQuery } from "@tanstack/solid-query";
import { Match, Switch } from "solid-js";
import { profileHref, repoHref } from "../lib/hrefGen.ts";
import { getOctokit, parseRestOctokitResponse } from "../lib/octokit.ts";

function Home() {
    const query = useQuery(() => ({
        queryKey: ["repoData"],
        queryFn: () =>
            getOctokit()
                .rest.users.getAuthenticated()
                .then((res) => parseRestOctokitResponse(res)),
    }));

    return (
        <main>
            <Switch>
                <Match when={query.isPending}>
                    <Text>Loading...</Text>
                </Match>
                <Match when={query.isError}>
                    <Text>Error</Text>
                </Match>
                <Match when={query.isSuccess}>
                    <Stack
                        align="center"
                        gap="condensed"
                        sx={{ margin: "0 auto" }}
                    >
                        <Heading as="h1" size="large">
                            Hi {query.data.name}!
                        </Heading>
                        <Text as="p">
                            Your Profile:{" "}
                            <Link href={profileHref(query.data.login)}>
                                {query.data.login}
                            </Link>
                        </Text>
                        <Text as="p">
                            Demo:{" "}
                            <Link href={repoHref("servo", "servo")}>Servo</Link>
                        </Text>
                    </Stack>
                </Match>
            </Switch>
        </main>
    );
}

export default Home;
