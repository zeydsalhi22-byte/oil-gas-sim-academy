/**
 * Client-only SPA entry used exclusively by the Capacitor Android build
 * (`npm run build:mobile`). It reuses the existing router and route
 * tree so the app looks and behaves identically to the SSR web build.
 * Not imported by the SSR production pipeline.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found in index.html");
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
