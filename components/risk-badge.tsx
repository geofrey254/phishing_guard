import type { ReactNode } from "react";

import type { RiskClassification } from "@/lib/detection";

interface RiskBadgeProps {
  label: RiskClassification;
  compact?: boolean;
  icon?: ReactNode;
}

const toneMap: Record<RiskClassification, string> = {
  "Low Risk": "border-[#cfe9d2] bg-[#f3fbf5] text-[#166534]",
  Suspicious: "border-[#f1dfb0] bg-[#fffaf1] text-[#7a5a00]",
  "Potential Phishing": "border-[#f1c4c4] bg-[#fff5f5] text-[#7f1d1d]",
};

export function RiskBadge({ label, compact = false, icon }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 border text-[11px] font-semibold uppercase tracking-[0.14em] ${compact ? "px-2 py-1" : "px-3 py-1.5"} ${toneMap[label]}`}
    >
      {icon}
      {label}
    </span>
  );
}
