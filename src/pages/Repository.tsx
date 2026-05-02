export type RepositoryProps = {
  profile: string
  repo: string
}

function Repository(props: RepositoryProps) {
  void props.profile
  void props.repo

  return <main class="min-h-screen overflow-hidden bg-[#f3efe4] text-[#191510]"></main>
}

export default Repository
