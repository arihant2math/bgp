import RepoPageLayout from "../../components/RepoPageLayout.tsx";

export type PullsProps = {
    profile: string;
    repo: string;
};

function Pulls(props: PullsProps) {
    return (
        <RepoPageLayout profile={props.profile} repo={props.repo} active="pulls" />
    );
}

export default Pulls;
