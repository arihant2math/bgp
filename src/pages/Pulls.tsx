export type PullsProps = {
  profile: string
  repo: string
}

function Pulls(props: PullsProps) {
  void props.profile
  void props.repo

  return <main class="min-h-screen overflow-hidden bg-[#f3efe4] text-[#191510]"></main>
}

export default Pulls
