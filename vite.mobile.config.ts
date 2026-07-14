import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

/**
 * Standalone SPA build config for Capacitor (Android WebView).
 * Produces a fully static, client-only bundle under `dist-mobile/`
 * that Capacitor packages into the APK. The SSR web build
 * (`vite.config.ts` + TanStack Start) is untouched.
 */
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: path.resolve(__dirname, "src/routes"),
      generatedRouteTree: path.resolve(__dirname, "src/routeTree.gen.ts"),
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist-mobile",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2020",
    // Ensure all assets use relative paths so they resolve from within
    // the Android WebView's file:// context.
    assetsInlineLimit: 0,
  },
  base: "./",
});
