import {
    Box,
    Button,
    Heading,
    Link,
    Stack,
    Text,
    TextInput,
} from "@primer/solid";
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
        <Box
            as="main"
            sx={{
                display: "grid",
                "min-height": "100vh",
                "place-items": "center",
                overflow: "hidden",
                "padding-inline": "1rem",
            }}
        >
            <Stack
                as="form"
                onSubmit={handleSubmit}
                gap="cozy"
                sx={{
                    width: "100%",
                    "max-width": "28rem",
                    padding: "1.5rem",
                    border: "1px solid var(--borderColor-default)",
                    "border-radius": "0.375rem",
                    "background-color": "var(--bgColor-default)",
                    "box-shadow":
                        "var(--shadow-resting-small, 0 1px 3px rgba(31, 35, 40, 0.12))",
                }}
            >
                <Heading as="h1" size="medium">
                    Sign in with a token
                </Heading>
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
                <Text
                    as="p"
                    size="small"
                    style={{ color: "var(--fgColor-muted)" }}
                >
                    Create a personal auth token (
                    <Link href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token">
                        Docs
                    </Link>
                    )
                </Text>
            </Stack>
        </Box>
    );
}

export default Login;
