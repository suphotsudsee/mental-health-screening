"use client";

import { useEffect } from "react";

/**
 * Registers a basic service worker to enable "Add to Home Screen" on mobile.
 */
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch((err) => console.error("SW registration failed", err));
    }
  }, []);

  return null;
}
