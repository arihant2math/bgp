import RepoPageLayout from "../../components/RepoPageLayout.tsx";

export type IssuesProps = {
    profile: string;
    repo: string;
};

function Issues(props: IssuesProps) {
    return (
        <RepoPageLayout
            profile={props.profile}
            repo={props.repo}
            active="issues"
        />
    );
}

export default Issues;
