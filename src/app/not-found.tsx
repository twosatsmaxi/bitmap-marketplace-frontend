import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 font-[family-name:var(--font-jetbrains-mono)] text-8xl font-bold text-[var(--color-primary)]">
        404
      </div>
      <h1 className="mb-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-text-primary)]">
        Page not found
      </h1>
      <p className="mb-8 max-w-md text-sm text-[var(--color-text-primary)]/60">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-6 py-2.5 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
      >
        Go Home
      </Link>
    </div>
  );
}
