import RepoWorkItemsPage from "../../components/RepoWorkItemsPage.tsx";

export type IssuesProps = {
    profile: string;
    repo: string;
};

function Issues(props: IssuesProps) {
    return (
        <RepoWorkItemsPage
            profile={props.profile}
            repo={props.repo}
            kind="issues"
        />
    );
}

export default Issues;
