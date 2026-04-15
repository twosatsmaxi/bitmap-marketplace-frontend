"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { createGiveaway } from "@/lib/giveaway-api";
import { TextInput } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateGiveawayPage() {
  const router = useRouter();
  const { isConnected, wallets } = useWalletConnect();

  const [inscriptionId, setInscriptionId] = useState("");
  const [title, setTitle] = useState("");
  const [priceSats, setPriceSats] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
        <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            Connect your wallet to create a giveaway
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const price = parseInt(priceSats, 10);
      if (isNaN(price) || price <= 0) {
        setError("Price must be a positive number in sats");
        setSubmitting(false);
        return;
      }

      const giveaway = await createGiveaway({
        inscription_id: inscriptionId,
        price_sats: price,
        title,
        description: description || undefined,
        criteria: criteria || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });

      router.push(`/giveaways/${giveaway.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create giveaway");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Back link */}
      <Link
        href="/giveaways"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Giveaways
      </Link>

      <div className="home-panel overflow-hidden">
        <div className="border-b border-[rgba(120,72,18,0.55)] bg-[#0d1117] p-4 md:p-6">
          <h1 className="font-mono text-lg md:text-xl font-black uppercase tracking-[0.08em] text-primary">
            Create Giveaway
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-black/45 p-4 md:p-6">
          <TextInput
            label="Title"
            placeholder="e.g. Rare Bitmap Giveaway"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextInput
            label="Inscription ID"
            placeholder="Inscription ID of the bitmap to give away"
            value={inscriptionId}
            onChange={(e) => setInscriptionId(e.target.value)}
            required
          />

          <TextInput
            label="Price (sats)"
            placeholder="Price winner pays for the locked listing"
            type="number"
            min="1"
            value={priceSats}
            onChange={(e) => setPriceSats(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500"
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-3 py-2 font-mono text-xs text-zinc-300 transition-colors placeholder:text-zinc-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </div>

          <TextInput
            label="Criteria"
            placeholder="Optional entry criteria"
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />

          <TextInput
            label="Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          {error && (
            <p className="font-mono text-[10px] text-red-400">{error}</p>
          )}

          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={submitting}
            className="w-full"
          >
            Create Giveaway
          </Button>
        </form>
      </div>
    </div>
  );
}
