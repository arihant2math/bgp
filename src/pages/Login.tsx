import { Button, TextInput } from "@primer/solid";
import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";

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
        <main class="grid min-h-screen place-items-center overflow-hidden px-4">
            <form
                onSubmit={handleSubmit}
                class="flex w-full max-w-md flex-col gap-3 rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-6 shadow-sm"
            >
                <h1 class="text-xl font-semibold">Sign in with a token</h1>
                <TextInput
                    type="password"
                    value={token()}
                    onInput={(event) => setToken(event.currentTarget.value)}
                    autocomplete="off"
                    placeholder="GitHub personal access token"
                    block
                />
                <Button variant="primary" type="submit">
                    Login
                </Button>
                <p class="text-sm text-[var(--fgColor-muted)]">
                    Create a personal auth token (
                    <a
                        class="text-[var(--fgColor-accent)] hover:underline"
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
