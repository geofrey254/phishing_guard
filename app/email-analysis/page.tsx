"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { RiskBadge } from "@/components/risk-badge";
import { analyseEmail } from "@/lib/email-analysis";
import type { HistoryEntry } from "@/lib/detection";
import { generateHistoryId, getRiskInfo } from "@/lib/detection";
import { readHistory, writeHistory } from "@/lib/history";

export default function EmailAnalysisPage() {
  const [subject, setSubject] = useState(
    "Urgent account verification required",
  );
  const [body, setBody] = useState(
    "Your account has been locked. Verify your password and login details immediately to avoid security restrictions. Click here to update your account and confirm your identity before the deadline.",
  );
  const [result, setResult] = useState<ReturnType<typeof analyseEmail> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyse = () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    window.setTimeout(() => {
      try {
        const nextResult = analyseEmail(subject, body);
        setResult(nextResult);
        setError("");

        const history = readHistory();
        const entry: HistoryEntry = {
          id: generateHistoryId(),
          type: "Email",
          label: nextResult.subject || "Email analysis",
          score: nextResult.score,
          classification: nextResult.classification,
          timestamp: nextResult.timestamp,
          summary: nextResult.summary,
        };

        const updated = [entry, ...history].slice(0, 40);
        writeHistory(updated);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to analyse the email.",
        );
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const selectedRisk = result ? getRiskInfo(result.classification) : null;
  const scoreTone = result
    ? result.score >= 60
      ? "bg-[#b42318]"
      : result.score >= 30
        ? "bg-[#b7791f]"
        : "bg-[#2e7d32]"
    : "bg-[#0f172a]";

  return (
    <div className="space-y-6">
      <div className="border border-[#dfe3e8] bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
              Email analysis
            </p>
            <h2 className="text-2xl font-semibold text-[#111827]">
              Assess a suspicious email
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#344054]">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-2 w-full border border-[#dfe3e8] bg-[#fafafa] px-3 py-3 text-sm text-[#111827] outline-none focus:border-[#111827]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#344054]">
              Email content
            </label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              className="mt-2 w-full border border-[#dfe3e8] bg-[#fafafa] px-3 py-3 text-sm text-[#111827] outline-none focus:border-[#111827]"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAnalyse}
            disabled={isLoading}
            className="flex items-center gap-2 border border-[#111827] bg-[#111827] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing...
              </>
            ) : (
              "Analyse Email"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setSubject("");
              setBody("");
              setError("");
              setResult(null);
            }}
            disabled={isLoading}
            className="border border-[#dfe3e8] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 border border-[#f1c4c4] bg-[#fff5f5] p-3 text-sm text-[#7f1d1d]">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6 border border-[#dfe3e8] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                  Email risk
                </p>
                <h3 className="text-xl font-semibold text-[#111827]">
                  Email assessment
                </h3>
              </div>
            </div>
            <RiskBadge label={result.classification} />
          </div>

          <div className="flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight text-[#111827]">
              {result.score}
            </span>
            <span className="pb-1 text-sm font-medium uppercase tracking-[0.14em] text-[#667085]">
              / 100
            </span>
          </div>

          <div className="h-2 w-full bg-[#eef1f4]">
            <div
              className={`h-2 ${scoreTone}`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          <div className="rounded-[4px] border border-[#dfe3e8] bg-[#fafafa] p-4 text-sm text-[#475467]">
            {result.summary}
          </div>

          <div className="rounded-[4px] border border-[#dfe3e8] bg-[#fafafa] p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#667085]">
              Recommended action
            </p>
            <p className="mt-2 text-sm text-[#475467]">
              {selectedRisk?.action}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
              Warning signs identified
            </p>
            <div className="flex flex-wrap gap-2">
              {result.triggeredRules.length > 0 ? (
                result.triggeredRules.map((rule) => (
                  <span
                    key={rule.id}
                    className="border border-[#dfe3e8] bg-[#fafafa] px-2.5 py-1.5 text-xs font-medium text-[#344054]"
                  >
                    {rule.label}
                  </span>
                ))
              ) : (
                <span className="border border-[#dfe3e8] bg-[#fafafa] px-2.5 py-1.5 text-xs font-medium text-[#344054]">
                  No phishing indicators triggered.
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.rules.map((rule) => (
              <div
                key={rule.id}
                className={`border p-4 ${
                  rule.triggered
                    ? "border-[#e4e7ec] bg-[#fffaf1]"
                    : "border-[#e4e7ec] bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#111827]">
                    {rule.label}
                  </p>
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#667085]">
                    +{rule.score}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#475467]">
                  {rule.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em]">
                  {rule.triggered ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#166534]" />
                      <span className="text-[#166534]">Triggered</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-[#667085]" />
                      <span className="text-[#667085]">Not triggered</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
