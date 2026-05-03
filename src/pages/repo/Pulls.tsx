import RepoNavbar from "../../components/RepoNavbar.tsx";

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
