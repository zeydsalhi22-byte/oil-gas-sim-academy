import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Keep the Nitro server runtime so Lovable hosting/preview can serve the app.
  // SPA prerender still emits a static dist/client/index.html for Capacitor packaging.
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: { outputPath: "/index" },
    },
    server: { entry: "server" },
  },
});
