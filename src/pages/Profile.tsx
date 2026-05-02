export type ProfileProps = {
    profile: string;
};

function Profile(props: ProfileProps) {
    void props.profile;

    return <main></main>;
}

export default Profile;
