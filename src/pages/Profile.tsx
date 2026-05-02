export type ProfileProps = {
  profile: string
}

function Profile(props: ProfileProps) {
  void props.profile

  return <main class="min-h-screen overflow-hidden bg-[#f3efe4] text-[#191510]"></main>
}

export default Profile
