import { Octokit } from "octokit";

export function getOctokit() {
    return new Octokit({
        auth: localStorage.getItem("gh_api_key") ?? undefined,
    });
}

export function parseRestOctokitResponse(response: { data: any }): any {
    console.log(response);
    return response.data;
}
