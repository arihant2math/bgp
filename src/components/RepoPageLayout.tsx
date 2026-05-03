import type { JSX } from "solid-js";
import RepoNavbar from "./RepoNavbar.tsx";
import type { RepoTab } from "./RepoNavbar.tsx";

export type RepoPageLayoutProps = {
    profile: string;
    repo: string;
    active: RepoTab;
    children?: JSX.Element;
};

function RepoPageLayout(props: RepoPageLayoutProps) {
    return (
        <main>
            <RepoNavbar
                profile={props.profile}
                repo={props.repo}
                active={props.active}
            />
            <div class="max-w-6xl mx-auto mt-8">{props.children}</div>
        </main>
    );
}

export default RepoPageLayout;
