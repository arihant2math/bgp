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
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    value={token()}
                    onInput={(event) => setToken(event.currentTarget.value)}
                    autocomplete="off"
                />
                <button type="submit">Login</button>
            </form>
        </main>
    );
}

export default Login;
