import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Disable nitro server build — produce a fully static SPA suitable for Capacitor packaging.
  nitro: false,
  tanstackStart: {
    // SPA mode: prerender the shell as static HTML and hydrate client-side.
    spa: { enabled: true },
    server: { entry: "server" },
  },
});
