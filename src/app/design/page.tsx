"use client";

import { useState } from "react";

/* -- UI Components --------------------------------------------------------- */
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { TextInput, Checkbox } from "@/components/ui/Input";
import { Spinner, ShimmerBar, Skeleton, PulseDots } from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/hooks/useToast";

/* -- Design Tokens --------------------------------------------------------- */
import {
  colors,
  primaryAlpha,
  whiteAlpha,
  btcHeatMap,
  rarityColors,
  shadows,
  fontSize,
  tracking,
  fontFamily,
  layout,
  radii,
} from "@/lib/tokens";

/* ========================================================================== */
/*  Shared layout helpers                                                      */
/* ========================================================================== */

function SectionHeader({ title, id }: { title: string; id: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <h2 className="font-mono text-lg font-bold uppercase tracking-[0.18em] text-zinc-100">
        {title}
      </h2>
      <div className="mt-2 h-px bg-gradient-to-r from-[rgba(120,72,18,0.6)] via-[rgba(120,72,18,0.25)] to-transparent" />
    </div>
  );
}

function Swatch({
  name,
  value,
  textDark,
}: {
  name: string;
  value: string;
  textDark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="h-12 w-12 rounded border border-zinc-700/50"
        style={{ backgroundColor: value }}
      />
      <span
        className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
          textDark ? "text-zinc-600" : "text-zinc-400"
        }`}
      >
        {name}
      </span>
      <span className="font-mono text-[8px] text-zinc-600">{value}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </span>
  );
}

function DemoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ========================================================================== */
/*  Section: Tokens                                                            */
/* ========================================================================== */

function TokensSection() {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Design Tokens" id="tokens" />

      {/* Core colors */}
      <div className="flex flex-col gap-3">
        <Label>Core Colors</Label>
        <div className="flex flex-wrap gap-4">
          {Object.entries(colors).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </div>
      </div>

      {/* Primary alpha ramp */}
      <div className="flex flex-col gap-3">
        <Label>Primary Alpha</Label>
        <div className="flex flex-wrap gap-3">
          {Object.entries(primaryAlpha).map(([key, value]) => (
            <Swatch key={key} name={`α${key}`} value={value} />
          ))}
        </div>
      </div>

      {/* White alpha ramp */}
      <div className="flex flex-col gap-3">
        <Label>White Alpha</Label>
        <div className="flex flex-wrap gap-3">
          {Object.entries(whiteAlpha).map(([key, value]) => (
            <Swatch key={key} name={`w${key}`} value={value} />
          ))}
        </div>
      </div>

      {/* BTC heat map */}
      <div className="flex flex-col gap-3">
        <Label>BTC Heat Map</Label>
        <div className="flex flex-wrap gap-3">
          {Object.entries(btcHeatMap).map(([key, value]) => (
            <Swatch key={key} name={key} value={value} />
          ))}
        </div>
      </div>

      {/* Rarity colors */}
      <div className="flex flex-col gap-3">
        <Label>Rarity Colors</Label>
        <div className="flex flex-wrap gap-3">
          {Object.entries(rarityColors).map(([key, value]) => (
            <Swatch key={key} name={key} value={value} />
          ))}
        </div>
      </div>

      {/* Type Scale */}
      <div className="flex flex-col gap-3">
        <Label>Type Scale</Label>
        <div className="flex flex-col gap-3 rounded border border-zinc-800 bg-zinc-900/40 p-4">
          {Object.entries(fontSize).map(([name, size]) => (
            <div key={name} className="flex items-baseline gap-4">
              <span className="w-12 shrink-0 font-mono text-[9px] text-zinc-500 uppercase">
                {name}
              </span>
              <span
                className="font-mono text-zinc-300"
                style={{ fontSize: size }}
              >
                {size} — The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking */}
      <div className="flex flex-col gap-3">
        <Label>Letter Spacing (tracking)</Label>
        <div className="flex flex-col gap-2 rounded border border-zinc-800 bg-zinc-900/40 p-4">
          {Object.entries(tracking).map(([name, value]) => (
            <div key={name} className="flex items-baseline gap-4">
              <span className="w-16 shrink-0 font-mono text-[9px] text-zinc-500 uppercase">
                {name}
              </span>
              <span
                className="font-mono text-xs text-zinc-300 uppercase"
                style={{ letterSpacing: value }}
              >
                Bitmap Marketplace — {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Font families */}
      <div className="flex flex-col gap-3">
        <Label>Font Families</Label>
        <div className="flex flex-col gap-3 rounded border border-zinc-800 bg-zinc-900/40 p-4">
          {Object.entries(fontFamily).map(([name, stack]) => (
            <div key={name} className="flex items-baseline gap-4">
              <span className="w-16 shrink-0 font-mono text-[9px] text-zinc-500 uppercase">
                {name}
              </span>
              <span
                className="text-sm text-zinc-300"
                style={{ fontFamily: stack.join(", ") }}
              >
                AaBbCcDdEeFf 0123456789
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shadows */}
      <div className="flex flex-col gap-3">
        <Label>Shadows</Label>
        <div className="flex flex-wrap gap-6">
          {Object.entries(shadows).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-24 rounded border border-zinc-700/40 bg-zinc-900"
                style={{ boxShadow: value }}
              />
              <span className="font-mono text-[9px] text-zinc-500 uppercase">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Layout + Radii */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Label>Layout</Label>
          <div className="flex flex-col gap-1 rounded border border-zinc-800 bg-zinc-900/40 p-4">
            {Object.entries(layout).map(([name, value]) => (
              <div key={name} className="flex justify-between font-mono text-[10px]">
                <span className="text-zinc-500">{name}</span>
                <span className="text-zinc-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Label>Radii</Label>
          <div className="flex flex-wrap gap-4">
            {Object.entries(radii).map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div
                  className="h-12 w-12 border border-primary/40 bg-primary/10"
                  style={{ borderRadius: value }}
                />
                <span className="font-mono text-[9px] text-zinc-500">
                  {name}: {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  Section: Buttons                                                           */
/* ========================================================================== */

function ButtonSection() {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Button" id="button" />

      {/* Variants */}
      <DemoRow label="Variants">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </DemoRow>

      {/* Sizes */}
      <DemoRow label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </DemoRow>

      {/* States */}
      <DemoRow label="States">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button variant="danger" loading>
          Danger Loading
        </Button>
        <Button variant="secondary" disabled>
          Sec Disabled
        </Button>
      </DemoRow>

      {/* All combos */}
      <div className="flex flex-col gap-3">
        <Label>Size x Variant Matrix</Label>
        <div className="grid grid-cols-4 gap-3">
          {(["primary", "secondary", "ghost", "danger"] as const).map(
            (variant) =>
              (["sm", "md", "lg"] as const).map((size) => (
                <Button key={`${variant}-${size}`} variant={variant} size={size}>
                  {variant} {size}
                </Button>
              ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  Section: Badge                                                             */
/* ========================================================================== */

function BadgeSection() {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Badge" id="badge" />

      {/* Status */}
      <DemoRow label="Status Variant">
        <Badge variant="status" status="listed" />
        <Badge variant="status" status="has_offer" />
        <Badge variant="status" status="unlisted" />
      </DemoRow>

      {/* Rarity */}
      <DemoRow label="Rarity Variant">
        <Badge variant="rarity" rarity="common" />
        <Badge variant="rarity" rarity="uncommon" />
        <Badge variant="rarity" rarity="rare" />
        <Badge variant="rarity" rarity="epic" />
        <Badge variant="rarity" rarity="legendary" />
      </DemoRow>

      {/* Chip */}
      <DemoRow label="Chip Variant">
        <Badge variant="chip">Inactive Chip</Badge>
        <Badge variant="chip" active>
          Active Chip
        </Badge>
      </DemoRow>

      {/* Tag */}
      <DemoRow label="Tag Variant">
        <Badge variant="tag">palindrome</Badge>
        <Badge variant="tag">nakamoto</Badge>
        <Badge variant="tag">punk</Badge>
      </DemoRow>

      {/* Soon */}
      <DemoRow label="Soon Variant">
        <Badge variant="soon" />
        <Badge variant="soon">Coming</Badge>
      </DemoRow>
    </section>
  );
}

/* ========================================================================== */
/*  Section: Card                                                              */
/* ========================================================================== */

function CardSection() {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Card" id="card" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Default */}
        <div className="flex flex-col gap-2">
          <Label>default</Label>
          <Card variant="default" className="p-6">
            <p className="font-mono text-xs text-zinc-400">
              Default card — subtle white border, surface gradient
            </p>
          </Card>
        </div>

        {/* Panel */}
        <div className="flex flex-col gap-2">
          <Label>panel</Label>
          <Card variant="panel" className="p-6">
            <p className="font-mono text-xs text-zinc-400">
              Panel card — warm amber border, pixel-grid overlay
            </p>
          </Card>
        </div>

        {/* Frame */}
        <div className="flex flex-col gap-2">
          <Label>frame</Label>
          <Card variant="frame" className="p-6">
            <p className="font-mono text-xs text-zinc-400">
              Frame card — blurred surface, primary corner accents
            </p>
          </Card>
        </div>

        {/* Default with hover */}
        <div className="flex flex-col gap-2">
          <Label>default + hover</Label>
          <Card variant="default" hover className="p-6">
            <p className="font-mono text-xs text-zinc-400">
              Hover over me — border transitions to primary
            </p>
          </Card>
        </div>
      </div>

      {/* Row variant — stacked list */}
      <div className="flex flex-col gap-2">
        <Label>row (stacked list)</Label>
        <div>
          <Card variant="row" hover>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300">
                420000.bitmap
              </span>
              <Badge variant="status" status="listed" />
            </div>
          </Card>
          <Card variant="row" hover>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300">
                100000.bitmap
              </span>
              <Badge variant="rarity" rarity="rare" />
            </div>
          </Card>
          <Card variant="row" hover>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300">
                750000.bitmap
              </span>
              <Badge variant="status" status="has_offer" />
            </div>
          </Card>
        </div>
      </div>

      {/* Card as different element */}
      <div className="flex flex-col gap-2">
        <Label>as=&quot;section&quot; (polymorphic)</Label>
        <Card variant="default" hover as="section" className="p-6">
          <p className="font-mono text-xs text-zinc-400">
            Rendered as a &lt;section&gt; element via the polymorphic &quot;as&quot; prop
          </p>
        </Card>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  Section: Input                                                             */
/* ========================================================================== */

function InputSection() {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(true);

  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Input" id="input" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic */}
        <div className="flex flex-col gap-2">
          <Label>TextInput — basic</Label>
          <TextInput placeholder="Enter block number..." />
        </div>

        {/* With label */}
        <div className="flex flex-col gap-2">
          <Label>TextInput — with label</Label>
          <TextInput label="Block Number" placeholder="420000" />
        </div>

        {/* With icon */}
        <div className="flex flex-col gap-2">
          <Label>TextInput — with icon</Label>
          <TextInput
            label="Search"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
            placeholder="Search bitmaps..."
          />
        </div>

        {/* With error */}
        <div className="flex flex-col gap-2">
          <Label>TextInput — error</Label>
          <TextInput
            label="Inscription ID"
            placeholder="abc123..."
            error="Invalid inscription ID format"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <DemoRow label="Checkbox">
        <Checkbox
          label="Unchecked"
          checked={checked1}
          onChange={setChecked1}
        />
        <Checkbox
          label="Checked"
          checked={checked2}
          onChange={setChecked2}
        />
      </DemoRow>
    </section>
  );
}

/* ========================================================================== */
/*  Section: Loader                                                            */
/* ========================================================================== */

function LoaderSection() {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Loader" id="loader" />

      {/* Spinner */}
      <DemoRow label="Spinner">
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span className="font-mono text-[9px] text-zinc-500">sm</span>
        </div>
        <div className="flex items-center gap-2">
          <Spinner size="md" />
          <span className="font-mono text-[9px] text-zinc-500">md</span>
        </div>
        <div className="flex items-center gap-2">
          <Spinner size="lg" />
          <span className="font-mono text-[9px] text-zinc-500">lg</span>
        </div>
      </DemoRow>

      {/* ShimmerBar */}
      <div className="flex flex-col gap-2">
        <Label>ShimmerBar</Label>
        <ShimmerBar />
        <ShimmerBar className="w-1/2" />
        <ShimmerBar className="w-1/3" />
      </div>

      {/* Skeleton */}
      <div className="flex flex-col gap-2">
        <Label>Skeleton</Label>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Label>Skeleton — card placeholder</Label>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded border border-zinc-800 p-4"
            >
              <Skeleton className="h-24 w-32 rounded" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* PulseDots */}
      <DemoRow label="PulseDots">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-400">Loading</span>
          <PulseDots />
        </div>
      </DemoRow>
    </section>
  );
}

/* ========================================================================== */
/*  Section: Feedback (EmptyState + ErrorState + Toast)                        */
/* ========================================================================== */

function FeedbackSection() {
  const { toast } = useToast();

  return (
    <section className="flex flex-col gap-8">
      <SectionHeader title="Feedback" id="feedback" />

      {/* EmptyState */}
      <div className="flex flex-col gap-3">
        <Label>EmptyState — default</Label>
        <EmptyState />
      </div>

      <div className="flex flex-col gap-3">
        <Label>EmptyState — with description and action</Label>
        <EmptyState
          title="No bitmaps found"
          description="Try adjusting your filters or search terms to find what you're looking for."
          action={{
            label: "Clear filters",
            onClick: () =>
              toast({ title: "Filters cleared", variant: "success" }),
          }}
        />
      </div>

      {/* ErrorState */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label>ErrorState — inline</Label>
          <ErrorState
            variant="inline"
            message="Failed to load bitmap data"
            retry={() =>
              toast({ title: "Retrying...", variant: "default" })
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>ErrorState — block</Label>
          <ErrorState
            variant="block"
            message="Unable to connect to the indexer. Please try again later."
            retry={() =>
              toast({ title: "Retrying connection...", variant: "default" })
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>ErrorState — terminal</Label>
          <ErrorState
            variant="terminal"
            message="ECONNREFUSED 127.0.0.1:8332"
            retry={() =>
              toast({ title: "Retrying...", variant: "default" })
            }
          />
        </div>
      </div>

      {/* Toast triggers */}
      <div className="flex flex-col gap-3">
        <Label>Toast</Label>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast({
                title: "Default toast",
                description: "This is a default notification.",
              })
            }
          >
            Default Toast
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              toast({
                title: "Transaction submitted",
                description: "Your PSBT has been broadcast to the network.",
                variant: "success",
              })
            }
          >
            Success Toast
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              toast({
                title: "Transaction failed",
                description: "Insufficient funds for this inscription.",
                variant: "error",
              })
            }
          >
            Error Toast
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast({
                title: "Long duration",
                description: "This toast will stay for 8 seconds.",
                duration: 8000,
              })
            }
          >
            Long Duration
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  Navigation sidebar                                                         */
/* ========================================================================== */

const NAV_ITEMS = [
  { id: "tokens", label: "Tokens" },
  { id: "button", label: "Button" },
  { id: "badge", label: "Badge" },
  { id: "card", label: "Card" },
  { id: "input", label: "Input" },
  { id: "loader", label: "Loader" },
  { id: "feedback", label: "Feedback" },
];

function SideNav() {
  return (
    <nav className="sticky top-28 hidden h-fit flex-col gap-1 lg:flex">
      <span className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-600">
        Sections
      </span>
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-primary"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/* ========================================================================== */
/*  Page                                                                       */
/* ========================================================================== */

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-bg font-mono">
      {/* Header */}
      <header className="border-b border-[rgba(120,72,18,0.35)] bg-bg/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-[0.2em] text-zinc-100">
            Design System
          </h1>
          <p className="mt-2 font-mono text-xs text-zinc-500">
            Bitmap Marketplace — Living Styleguide
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex max-w-7xl gap-12 px-6 py-12">
        {/* Sidebar nav */}
        <aside className="w-36 shrink-0">
          <SideNav />
        </aside>

        {/* Content */}
        <main className="flex min-w-0 flex-1 flex-col gap-16">
          <TokensSection />
          <ButtonSection />
          <BadgeSection />
          <CardSection />
          <InputSection />
          <LoaderSection />
          <FeedbackSection />
        </main>
      </div>
    </div>
  );
}