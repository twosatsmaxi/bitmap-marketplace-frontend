import type { Bitmap } from "@/lib/types";
import { formatNumber, truncateAddr, truncateInscription } from "@/lib/utils";

export default function MetadataPanel({ bitmap }: { bitmap: Bitmap }) {
  const properties = [
    { label: "Inscription ID", value: truncateInscription(bitmap.inscriptionId) },
    { label: "Owner", value: truncateAddr(bitmap.owner) },
    { label: "Block Height", value: formatNumber(bitmap.blockNumber) },
    { label: "Genesis Height", value: formatNumber(bitmap.genesisHeight) },
    { label: "Sat Number", value: formatNumber(bitmap.sat) },
    { label: "Minted At", value: new Date(bitmap.mintedAt).toLocaleDateString() },
  ];

  return (
    <div className="home-panel px-5 py-5">
      <h2 className="mb-4 border-b border-[rgba(120,72,18,0.55)] pb-2 font-mono text-xl font-bold uppercase text-primary">Properties</h2>
      
      <div className="flex flex-col gap-3">
        {properties.map((prop, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="font-mono tracking-wide text-zinc-500">{prop.label}</span>
            <span className="font-mono text-zinc-300">{prop.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-[rgba(120,72,18,0.55)] pt-4">
        <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Traits</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center border border-[rgba(120,72,18,0.55)] bg-black/45 p-3 text-center">
            <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Pattern</span>
            <span className="font-mono text-sm font-bold uppercase text-primary capitalize">{bitmap.bitmapType}</span>
          </div>
          <div className="flex flex-col items-center justify-center border border-[rgba(120,72,18,0.55)] bg-black/45 p-3 text-center">
            <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Rarity</span>
            <span className="font-mono text-sm font-bold uppercase text-primary capitalize">{bitmap.rarity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
