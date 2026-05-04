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
            <div class="mx-auto mt-8 w-full max-w-[1280px] px-4 md:px-6">
                {props.children}
            </div>
        </main>
    );
}

export default RepoPageLayout;
