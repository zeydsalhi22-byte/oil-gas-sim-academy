import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Android APK build.
 *
 * The web assets consumed by the Android WebView are produced by the
 * separate SPA build target (`npm run build:mobile`), which writes a
 * static, client-only bundle to `dist-mobile/`. This is intentionally
 * decoupled from the SSR production build under `dist/` used by the
 * Lovable web preview / Cloudflare deployment — the visuals, routes,
 * and simulator logic are identical.
 */
const config: CapacitorConfig = {
  appId: "com.oilsim.academy",
  appName: "OilSim Academy",
  webDir: "dist-mobile",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
};

export default config;
