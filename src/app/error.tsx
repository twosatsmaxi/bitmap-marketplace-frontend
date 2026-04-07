"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 font-[family-name:var(--font-jetbrains-mono)] text-6xl text-[var(--color-primary)]">
        !ERR
      </div>
      <h1 className="mb-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-text-primary)]">
        Something went wrong
      </h1>
      <p className="mb-8 max-w-md text-sm text-[var(--color-text-primary)]/60">
        An unexpected error occurred. You can try again or head back to the
        homepage.
      </p>
      <button
        onClick={reset}
        className="border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-6 py-2.5 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
      >
        Try Again
      </button>
    </div>
  );
}
