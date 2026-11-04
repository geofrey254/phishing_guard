import { Clock3 } from "lucide-react";

import { RiskBadge } from "@/components/risk-badge";
import type { ScanResult } from "@/lib/detection";

interface ScanHistoryProps {
  items: ScanResult[];
}

export function ScanHistory({ items }: ScanHistoryProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-[#dfe3e8] bg-white p-8 text-center text-sm text-[#667085]">
        No scans have been saved yet. Start by analysing a URL.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-sm border border-[#dfe3e8] bg-white">
      <div className="grid grid-cols-[1.6fr_0.7fr_0.8fr] border-b border-[#dfe3e8] bg-[#f8f9fa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">
        <span>URL</span>
        <span>Date</span>
        <span>Risk</span>
      </div>

      {items.map((entry) => (
        <div
          key={`${entry.url}-${entry.timestamp}`}
          className="grid grid-cols-[1.6fr_0.7fr_0.8fr] items-center gap-4 border-b border-[#eef1f4] px-4 py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#111827]">
              {entry.url}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#475467]">
            <Clock3 className="h-3.5 w-3.5" />
            {new Date(entry.timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="flex justify-end">
            <RiskBadge label={entry.classification} compact />
          </div>
        </div>
      ))}
    </div>
  );
}
