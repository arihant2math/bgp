export type IssuesProps = {
  profile: string
  repo: string
}

function Issues(props: IssuesProps) {
  void props.profile
  void props.repo

  return <main class="min-h-screen overflow-hidden bg-[#f3efe4] text-[#191510]"></main>
}

export default Issues
