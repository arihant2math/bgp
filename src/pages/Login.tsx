import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "@primer/solid";

function Login() {
    const navigate = useNavigate();
    const [token, setToken] = createSignal("");

    const handleSubmit = (event: SubmitEvent) => {
        event.preventDefault();

        const trimmedToken = token().trim();

        if (!trimmedToken) {
            return;
        }

        localStorage.setItem("gh_api_key", trimmedToken);
        navigate("/", { replace: true });
    };

    return (
        <main class="min-h-screen overflow-hidden">
            <form
                onSubmit={handleSubmit}
                class="flex flex-col max-w-md gap-2 items-center justify-center"
            >
                <input
                    class="border rounded-md border-black p-1"
                    type="password"
                    value={token()}
                    onInput={(event) => setToken(event.currentTarget.value)}
                    autocomplete="off"
                />
                <Button variant="primary" type="submit">
                    Login
                </Button>
                <p>
                    Create a personal auth token (
                    <a
                        class="text-blue-500 hover-text-blue-600"
                        href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token"
                    >
                        Docs
                    </a>
                    )
                </p>
            </form>
        </main>
    );
}

export default Login;
