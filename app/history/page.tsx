"use client";

import { useMemo, useState } from "react";
import { Clock3, Filter, Trash2 } from "lucide-react";

import { RiskBadge } from "@/components/risk-badge";
import type {
  AnalysisType,
  HistoryEntry,
  RiskClassification,
} from "@/lib/detection";
import { readHistory, writeHistory } from "@/lib/history";

const riskOptions: Array<"All" | RiskClassification> = [
  "All",
  "Low Risk",
  "Suspicious",
  "Potential Phishing",
];

const typeOptions: Array<"All" | AnalysisType> = [
  "All",
  "URL",
  "Email",
  "Website",
];

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryEntry[]>(() => readHistory());
  const [selectedType, setSelectedType] = useState<"All" | AnalysisType>("All");
  const [selectedRisk, setSelectedRisk] = useState<"All" | RiskClassification>(
    "All",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const typeMatches = selectedType === "All" || item.type === selectedType;
      const riskMatches =
        selectedRisk === "All" || item.classification === selectedRisk;
      return typeMatches && riskMatches;
    });
  }, [items, selectedRisk, selectedType]);

  const activeId =
    filteredItems.some((item) => item.id === selectedId) && selectedId
      ? selectedId
      : (filteredItems[0]?.id ?? null);

  const selectedEntry =
    filteredItems.find((item) => item.id === activeId) ?? null;

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    writeHistory(updated);

    if (selectedId === id) {
      setSelectedId(updated[0]?.id ?? null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-[#dfe3e8] bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
              History
            </p>
            <h2 className="text-2xl font-semibold text-[#111827]">
              Unified scan log
            </h2>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#344054]">
              Analysis type
            </label>
            <select
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value as "All" | AnalysisType)
              }
              className="mt-2 w-full border border-[#dfe3e8] bg-[#fafafa] px-3 py-3 text-sm text-[#111827] outline-none focus:border-[#111827]"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#344054]">
              Risk classification
            </label>
            <select
              value={selectedRisk}
              onChange={(event) =>
                setSelectedRisk(
                  event.target.value as "All" | RiskClassification,
                )
              }
              className="mt-2 w-full border border-[#dfe3e8] bg-[#fafafa] px-3 py-3 text-sm text-[#111827] outline-none focus:border-[#111827]"
            >
              {riskOptions.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-sm border border-dashed border-[#dfe3e8] bg-[#fafafa] p-8 text-center text-sm text-[#667085]">
            No matching records were found.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="overflow-hidden rounded-sm border border-[#dfe3e8]">
              <div className="grid grid-cols-[1fr_1fr_0.8fr_0.7fr_0.5fr] border-b border-[#dfe3e8] bg-[#f8f9fa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">
                <span>Type</span>
                <span>Reference</span>
                <span>Date</span>
                <span>Risk</span>
                <span className="text-right">Delete</span>
              </div>

              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`grid w-full grid-cols-[1fr_1fr_0.8fr_0.7fr_0.5fr] items-center gap-4 border-b border-[#eef1f4] px-4 py-3 text-left last:border-b-0 ${
                    selectedId === item.id ? "bg-[#f8f9fa]" : "bg-white"
                  }`}
                >
                  <span className="text-sm font-medium text-[#111827]">
                    {item.type}
                  </span>
                  <span className="truncate text-sm text-[#475467]">
                    {item.label}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[#475467]">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <RiskBadge label={item.classification} compact />
                  <span className="flex justify-end">
                    <Trash2
                      className="h-4 w-4 text-[#475467]"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(item.id);
                      }}
                    />
                  </span>
                </button>
              ))}
            </div>

            {selectedEntry && (
              <div className="rounded-sm border border-[#dfe3e8] bg-[#fafafa] p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                  Selected record
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#111827]">
                  {selectedEntry.type} analysis
                </h3>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-[#111827]">
                    {selectedEntry.label}
                  </span>
                  <RiskBadge label={selectedEntry.classification} compact />
                </div>
                <div className="mt-4 space-y-2 text-sm text-[#475467]">
                  <p>Score: {selectedEntry.score}/100</p>
                  <p>
                    Date:{" "}
                    {new Date(selectedEntry.timestamp).toLocaleString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                  <p>{selectedEntry.summary}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
