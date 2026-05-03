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
    plugins: [solid(), tailwindcss()],
});
