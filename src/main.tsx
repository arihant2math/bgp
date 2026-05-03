import { render } from "solid-js/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { BaseStyles, ThemeProvider } from "./vendor/primer-solid";
import "./styles.css";
import App from "./App";

const root = document.getElementById("root");
const queryClient = new QueryClient();

if (!root) {
    throw new Error("Root element not found");
}

render(
    () => (
        <ThemeProvider>
            <BaseStyles>
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </BaseStyles>
        </ThemeProvider>
    ),
    root,
);
