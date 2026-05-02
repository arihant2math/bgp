import RepoNavbar from "../components/RepoNavbar";

export type IssuesProps = {
  profile: string;
  repo: string;
};

function Issues(props: IssuesProps) {
  return (
    <main>
      <RepoNavbar profile={props.profile} repo={props.repo} active="issues" />
    </main>
  );
}

export default Issues;
