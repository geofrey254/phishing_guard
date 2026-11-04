import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone?: "neutral" | "warn" | "danger" | "success";
}

const tones = {
  neutral: "border-[#dfe3e8] bg-white text-[#0f172a]",
  warn: "border-[#ead7a7] bg-[#fffaf0] text-[#6b4d00]",
  danger: "border-[#f1c4c4] bg-[#fff5f5] text-[#7f1d1d]",
  success: "border-[#cfe9d2] bg-[#f3fbf5] text-[#166534]",
};

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div
      className={`rounded-sm border p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] ${tones[tone]}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center border border-[#dfe3e8] bg-white text-[#0f172a]">
          {icon}
        </span>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-[#111827]">
        {value}
      </div>
      <p className="mt-2 text-sm text-[#475467]">{detail}</p>
    </div>
  );
}
