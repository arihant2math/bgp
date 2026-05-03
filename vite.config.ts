import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop();
const base =
    process.env.GITHUB_ACTIONS === "true" &&
    githubRepositoryName &&
    !githubRepositoryName.endsWith(".github.io")
        ? `/${githubRepositoryName}/`
        : "/";

export default defineConfig({
    base,
    resolve: {
        alias: {
            "@primer/solid": fileURLToPath(
                new URL("./src/vendor/primer-solid.ts", import.meta.url),
            ),
        },
    },
    optimizeDeps: {
        exclude: ["@primer/solid"],
    },
    plugins: [solid(), tailwindcss()],
});
