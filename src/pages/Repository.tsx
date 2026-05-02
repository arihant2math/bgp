import RepoNavbar from "../components/RepoNavbar";

export type RepositoryProps = {
    profile: string;
    repo: string;
};

function Repository(props: RepositoryProps) {
    return (
        <main>
            <RepoNavbar
                profile={props.profile}
                repo={props.repo}
                active="code"
            />
        </main>
    );
}

export default Repository;
