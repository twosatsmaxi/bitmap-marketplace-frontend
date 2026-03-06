import Link from "next/link";

interface ComingSoonPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function ComingSoonPage({
  eyebrow,
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <section className="home-panel relative overflow-hidden px-5 py-8 md:px-8 md:py-10">
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="home-eyebrow mb-3">{eyebrow}</p>
              <h1 className="font-mono text-3xl font-black uppercase tracking-[-0.03em] text-primary md:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl font-mono text-sm leading-6 text-zinc-400">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-md border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Soon
              </span>
              <Link href="/" className="home-button inline-flex items-center justify-center">
                Back to market
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
