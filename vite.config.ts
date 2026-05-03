import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [solid(), tailwindcss()],
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
