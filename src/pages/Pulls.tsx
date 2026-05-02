import RepoNavbar from "../components/RepoNavbar";

export type PullsProps = {
    profile: string;
    repo: string;
};

function Pulls(props: PullsProps) {
    return (
        <main>
            <RepoNavbar
                profile={props.profile}
                repo={props.repo}
                active="pulls"
            />
        </main>
    );
}

export default Pulls;
