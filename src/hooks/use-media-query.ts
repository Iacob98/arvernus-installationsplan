"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook. Returns `false` on the server (hydration-safe
 * default = "not mobile") and the real value on the client. Uses
 * `useSyncExternalStore` (React 19) to avoid effect-driven double-renders.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(query).matches;
    },
    () => false,
  );
}

/** True when viewport is below Tailwind's `md` breakpoint (< 768 px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/** True when viewport is below Tailwind's `sm` breakpoint (< 640 px). */
export function useIsSmall(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
