import { createSignal } from "solid-js";

export type RepoNavbarState = {
    avatarUrl: string;
    ownerLogin: string;
    repoName: string;
    visibility: string;
};

const [repoNavbarState, setRepoNavbarState] =
    createSignal<RepoNavbarState | null>(null);

export { repoNavbarState, setRepoNavbarState };
