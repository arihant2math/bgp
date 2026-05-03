import RepoWorkItemsPage from "../../components/RepoWorkItemsPage.tsx";

export type PullsProps = {
    profile: string;
    repo: string;
};

function Pulls(props: PullsProps) {
    return (
        <RepoWorkItemsPage
            profile={props.profile}
            repo={props.repo}
            kind="pulls"
        />
    );
}

export default Pulls;
