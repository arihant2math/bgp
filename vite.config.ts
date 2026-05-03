import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop();
const base =
    process.env.GITHUB_ACTIONS === "true" &&
    githubRepositoryName &&
    !githubRepositoryName.endsWith(".github.io")
        ? `/${githubRepositoryName}/`
        : "/";

const primerSolidSource = fileURLToPath(
    new URL("./node_modules/@primer/solid/src/index.ts", import.meta.url),
);
const primerSolidStyles = fileURLToPath(
    new URL("./node_modules/@primer/solid/src/styles.css", import.meta.url),
);

export default defineConfig({
    base,
    plugins: [solid(), tailwindcss()],
    resolve: {
        alias: [
            {
                find: "@primer/solid/styles.css",
                replacement: primerSolidStyles,
            },
            {
                find: "@primer/solid",
                replacement: primerSolidSource,
            },
        ],
    },
    // Allow accessing the dev server from the specific network hostname
    server: {
        // Bind to this host so the dev server is reachable at the given hostname
        host: "macbook-pro-3.tailbe8614.ts.net",
        // Ensure HMR client connects using the same hostname
        hmr: {
            host: "macbook-pro-3.tailbe8614.ts.net",
        },
    },
});
