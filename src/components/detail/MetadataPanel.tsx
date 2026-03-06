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
    <div className="panel-frame pixel-cut p-5">
      <h2 className="font-heading font-bold text-xl mb-4 border-b border-border pb-2">Properties</h2>
      
      <div className="flex flex-col gap-3">
        {properties.map((prop, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-mono tracking-wide">{prop.label}</span>
            <span className="text-text-primary font-mono">{prop.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-text-secondary">Traits</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-2 p-3 border border-border flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase text-text-secondary tracking-[0.16em] mb-1">Pattern</span>
            <span className="font-medium text-sm capitalize">{bitmap.bitmapType}</span>
          </div>
          <div className="bg-surface-2 p-3 border border-border flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase text-text-secondary tracking-[0.16em] mb-1">Rarity</span>
            <span className="font-medium text-sm capitalize">{bitmap.rarity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
