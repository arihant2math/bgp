import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";

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
            <form onSubmit={handleSubmit} class="flex flex-col max-w-md gap-2 items-center justify-center">
                <input
                    class="border rounded-md border-black p-1"
                    type="password"
                    value={token()}
                    onInput={(event) => setToken(event.currentTarget.value)}
                    autocomplete="off"
                />
                <button class="bg-blue-500 text-white rounded-md w-fit p-1" type="submit">Login</button>
            </form>
        </main>
    );
}

export default Login;
