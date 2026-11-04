"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { RiskBadge } from "@/components/risk-badge";
import { ScanHistory } from "@/components/scan-history";
import { StatCard } from "@/components/stat-card";
import { getRiskInfo, scanUrl, type ScanResult } from "@/lib/detection";

const STORAGE_KEY = "phishing-guard-history";
type TabKey = "dashboard" | "scanner" | "history";

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "scanner", label: "URL Scanner", icon: Search },
  { key: "history", label: "Scan History", icon: History },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [input, setInput] = useState(
    "https://secure-login-account-verification.com",
  );
  const [history, setHistory] = useState<ScanResult[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved) as ScanResult[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const stats = useMemo(() => {
    const total = history.length;
    const potential = history.filter(
      (item) => item.classification === "Potential Phishing",
    ).length;
    const suspicious = history.filter(
      (item) => item.classification === "Suspicious",
    ).length;
    const low = history.filter(
      (item) => item.classification === "Low Risk",
    ).length;

    return { total, potential, suspicious, low };
  }, [history]);

  const handleScan = () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    window.setTimeout(() => {
      try {
        const nextResult = scanUrl(input);
        const deduplicated = [
          nextResult,
          ...history.filter(
            (item) =>
              !(
                item.url === nextResult.url &&
                item.timestamp === nextResult.timestamp
              ),
          ),
        ].slice(0, 12);

        setResult(nextResult);
        setHistory(deduplicated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
        setError("");
        setActiveTab("scanner");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to analyse this URL.",
        );
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleClear = () => {
    setInput("");
    setError("");
    setResult(null);
  };

  const recentScans = history.slice(0, 5);
  const selectedRisk = result ? getRiskInfo(result.classification) : null;

  const scoreTone = result
    ? result.score >= 60
      ? "bg-[#b42318]"
      : result.score >= 30
        ? "bg-[#b7791f]"
        : "bg-[#2e7d32]"
    : "bg-[#0f172a]";

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#101828]">
      <header className="border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa] text-[#111827]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                  Cyber intelligence
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-[#111827]">
                  Phishing Guard
                </h1>
              </div>
            </div>

            <nav className="hidden items-center gap-2 md:flex">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === key
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-[#dfe3e8] bg-white text-[#475467] hover:bg-[#f8f9fa]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2 md:hidden">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 border px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] ${
                activeTab === key
                  ? "border-[#111827] bg-[#111827] text-white"
                  : "border-[#dfe3e8] bg-white text-[#475467]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-3 border border-[#dfe3e8] bg-white p-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                  Security overview
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#111827]">
                  Monitor URL risk in real time
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("scanner")}
                className="inline-flex items-center gap-2 border border-[#111827] bg-[#111827] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f2937]"
              >
                Scan a URL
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total URLs scanned"
                value={stats.total}
                detail="Saved findings in local history"
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <StatCard
                label="Potential phishing"
                value={stats.potential}
                detail="High-confidence malicious indicators"
                icon={<ShieldAlert className="h-4 w-4" />}
                tone="danger"
              />
              <StatCard
                label="Suspicious"
                value={stats.suspicious}
                detail="Needs review before access"
                icon={<AlertTriangle className="h-4 w-4" />}
                tone="warn"
              />
              <StatCard
                label="Low risk"
                value={stats.low}
                detail="No strong phishing pattern detected"
                icon={<ShieldCheck className="h-4 w-4" />}
                tone="success"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="border border-[#dfe3e8] bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                      Recent scan activity
                    </p>
                    <h3 className="text-lg font-semibold text-[#111827]">
                      Latest URL checks
                    </h3>
                  </div>
                </div>

                {recentScans.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-[#dfe3e8] bg-[#fafafa] p-6 text-sm text-[#667085]">
                    No recent scans yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentScans.map((entry) => (
                      <div
                        key={`${entry.url}-${entry.timestamp}`}
                        className="flex items-center justify-between gap-3 border border-[#eef1f4] bg-[#fafafa] p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#111827]">
                            {entry.url}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#667085]">
                            <Clock3 className="h-3 w-3" />
                            {new Date(entry.timestamp).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                        <RiskBadge label={entry.classification} compact />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-[#dfe3e8] bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                      Detection model
                    </p>
                    <h3 className="text-lg font-semibold text-[#111827]">
                      Rule weighting
                    </h3>
                  </div>
                </div>

                <ul className="space-y-3 text-sm text-[#475467]">
                  <li className="flex items-start justify-between gap-3 border-b border-[#eef1f4] pb-2">
                    <span>IP hostname</span>
                    <span className="font-medium text-[#111827]">+25</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-[#eef1f4] pb-2">
                    <span>Suspicious keywords</span>
                    <span className="font-medium text-[#111827]">+15</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-[#eef1f4] pb-2">
                    <span>Excessive subdomains</span>
                    <span className="font-medium text-[#111827]">+15</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-[#eef1f4] pb-2">
                    <span>Multiple hyphens</span>
                    <span className="font-medium text-[#111827]">+10</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-[#eef1f4] pb-2">
                    <span>Special characters</span>
                    <span className="font-medium text-[#111827]">+10</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-[#eef1f4] pb-2">
                    <span>HTTP instead of HTTPS</span>
                    <span className="font-medium text-[#111827]">+5</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 pb-2">
                    <span>@ in URL</span>
                    <span className="font-medium text-[#111827]">+20</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeTab === "scanner" && (
          <section className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="border border-[#dfe3e8] bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                      URL scanner
                    </p>
                    <h2 className="text-xl font-semibold text-[#111827]">
                      Analyse a link
                    </h2>
                  </div>
                </div>

                <label className="block text-sm font-medium text-[#344054]">
                  Target URL
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="https://example.com/login"
                  className="mt-2 w-full border border-[#dfe3e8] bg-[#fafafa] px-3 py-3 text-sm text-[#111827] outline-none focus:border-[#111827]"
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 border border-[#111827] bg-[#111827] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analysing...
                      </>
                    ) : (
                      "Analyse URL"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
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

              <div className="border border-[#dfe3e8] bg-white p-6">
                {result ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa] text-[#111827]">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                            Scan results
                          </p>
                          <h3 className="text-lg font-semibold text-[#111827]">
                            Risk score
                          </h3>
                        </div>
                      </div>
                      <RiskBadge label={result.classification} />
                    </div>

                    <div className="mt-5 flex items-end gap-3">
                      <span className="text-5xl font-semibold tracking-tight text-[#111827]">
                        {result.score}
                      </span>
                      <span className="pb-1 text-sm font-medium uppercase tracking-[0.14em] text-[#667085]">
                        / 100
                      </span>
                    </div>

                    <div className="mt-5 h-2 w-full bg-[#eef1f4]">
                      <div
                        className={`h-2 ${scoreTone}`}
                        style={{ width: `${result.score}%` }}
                      />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-[#475467]">
                      {selectedRisk?.description}
                    </p>
                    <div className="mt-5 rounded-sm border border-[#dfe3e8] bg-[#fafafa] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#667085]">
                        Recommended action
                      </p>
                      <p className="mt-2 text-sm text-[#475467]">
                        {selectedRisk?.action}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center border border-dashed border-[#dfe3e8] bg-[#fafafa] p-6 text-center">
                    <ShieldCheck className="h-8 w-8 text-[#344054]" />
                    <p className="mt-4 text-base font-medium text-[#111827]">
                      No scan results yet
                    </p>
                    <p className="mt-2 max-w-xs text-sm text-[#667085]">
                      Paste a link to see the risk score, triggered indicators,
                      and recommended actions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {result && (
              <div className="border border-[#dfe3e8] bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                      Findings
                    </p>
                    <h3 className="text-xl font-semibold text-[#111827]">
                      Detected indicators
                    </h3>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
                      No phishing indicators triggered
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                            <span className="text-[#667085]">
                              Not triggered
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section className="space-y-6">
            <div className="border border-[#dfe3e8] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa]">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#667085]">
                    Scan history
                  </p>
                  <h2 className="text-2xl font-semibold text-[#111827]">
                    Previous URL checks
                  </h2>
                </div>
              </div>

              <ScanHistory items={history} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
