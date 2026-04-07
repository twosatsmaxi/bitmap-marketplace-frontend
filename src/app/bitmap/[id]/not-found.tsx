import Link from "next/link";

export default function BitmapNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 font-[family-name:var(--font-jetbrains-mono)] text-6xl text-[var(--color-primary)]">
        ?_?
      </div>
      <h1 className="mb-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-[var(--color-text-primary)]">
        Bitmap not found
      </h1>
      <p className="mb-8 max-w-md text-sm text-[var(--color-text-primary)]/60">
        This bitmap doesn&apos;t exist or hasn&apos;t been inscribed yet.
      </p>
      <Link
        href="/explore"
        className="border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-6 py-2.5 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
      >
        Explore Bitmaps
      </Link>
    </div>
  );
}
