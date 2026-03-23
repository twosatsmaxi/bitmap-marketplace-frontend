"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Orchestrates smooth page transitions using the View Transitions API.
 * Falls back to a CSS opacity fade on unsupported browsers.
 */
export default function ViewTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const mainRef = useRef<HTMLDivElement>(null);

  const supportsViewTransitions =
    typeof document !== "undefined" && "startViewTransition" in document;

  // CSS fallback for browsers without View Transitions API
  const applyFallbackTransition = useCallback(() => {
    const main = mainRef.current;
    if (!main) return;
    main.style.opacity = "0";
    main.style.transform = "scale(0.99)";
    requestAnimationFrame(() => {
      main.style.transition = "opacity 200ms ease-in, transform 200ms ease-in";
      main.style.opacity = "1";
      main.style.transform = "scale(1)";
      const cleanup = () => {
        main.style.transition = "";
        main.style.transform = "";
        main.removeEventListener("transitionend", cleanup);
      };
      main.addEventListener("transitionend", cleanup, { once: true });
    });
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (!supportsViewTransitions) {
      applyFallbackTransition();
    }
    // View Transitions API triggers automatically via Next.js when supported
    // and enabled via CSS view-transition-name on the main element
  }, [pathname, supportsViewTransitions, applyFallbackTransition]);

  return (
    <div
      ref={mainRef}
      style={{ viewTransitionName: "main-content" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
