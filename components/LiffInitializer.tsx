"use client";

import { useEffect } from "react";

const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

export default function LiffInitializer() {
  useEffect(() => {
    if (!liffId) {
      console.warn("Missing NEXT_PUBLIC_LIFF_ID; skip LIFF init");
      return;
    }

    const initLiff = async () => {
      const liff = (window as typeof window & { liff?: any }).liff;

      if (!liff?.init) {
        console.error("LIFF SDK not loaded on window");
        return;
      }

      try {
        await liff.init({ liffId });

        if (liff.isLoggedIn()) {
          console.log("LIFF logged in");
        } else {
          liff.login();
        }
      } catch (error) {
        console.error("LIFF init failed", error);
      }
    };

    void initLiff();
  }, []);

  return null;
}
