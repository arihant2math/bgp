import { Octokit } from "octokit";

export function getOctokit() {
    return new Octokit({
        auth: localStorage.getItem("gh_api_key") ?? undefined,
    });
}
