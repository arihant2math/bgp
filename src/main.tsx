import { render } from "solid-js/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import "@primer/solid/styles.css";
import "./styles.css";
import App from "./App";

const root = document.getElementById("root");
const queryClient = new QueryClient();

if (!root) {
    throw new Error("Root element not found");
}

render(
    () => (
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    ),
    root,
);
