import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Build as a fully static SPA (no server runtime). Suitable for Capacitor packaging.
  nitro: false,
  tanstackStart: {
    spa: {
      enabled: true,
      // Emit the SPA shell as index.html at the dist root so Capacitor can serve it directly.
      prerender: { outputPath: "/index" },
    },
    server: { entry: "server" },
  },
});
