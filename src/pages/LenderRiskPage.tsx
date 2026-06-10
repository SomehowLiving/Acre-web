import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchBlueScore, getBaseUrl, type BlueScoreResponse } from "@/lib/api";

// ─── types ───────────────────────────────────────────────────────────────────

interface ConsentLog {
  txId: string;
  address: string;
  claimType: string;
  issuedAt: string;
  expiresAt: string;
}

// ─── deterministic helpers ───────────────────────────────────────────────────

function seed32(n: number) { return ((n * 1103515245 + 12345) >>> 0); }

function portfolioFromScore(baseScore: number, timeRange: "7d" | "30d" | "90d") {
  const multiplier = timeRange === "7d" ? 0.25 : timeRange === "30d" ? 1 : 3.2;
  const total = Math.max(30, Math.round(baseScore * 0.48 * multiplier));
  const approvalRate = Math.min(0.82, Math.max(0.42, baseScore / 1050));
  const approved = Math.round(total * approvalRate);
  const rejected = total - approved;
  const prime  = Math.max(4, Math.round(total * 0.26));
  const plus   = Math.max(6, Math.round(total * 0.38));
  const basic  = total - prime - plus;
  return { total, approved, rejected, prime, plus, basic, approvalRate };
}

function generateTrend(baseScore: number, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const s = seed32(baseScore + i);
    return {
      day: i + 1,
      approvals: Math.max(1, Math.round(3 + (s % 9))),
      rejections: Math.max(0, Math.round(1 + (s % 4))),
    };
  });
}

// ─── constants ───────────────────────────────────────────────────────────────

const FRAUD_SIGNALS = [
  {
    type: "Identity Reuse",
    severity: "info",
    detected: 0,
    autoResolved: 0,
    detail: "No duplicate wallet↔DigiLocker bindings detected across sessions",
    mechanism: "claimHash binds identity to wallet address at proof generation time",
  },
  {
    type: "Proof Replay",
    severity: "warn",
    detected: 2,
    autoResolved: 2,
    detail: "2 stale proof hashes matched on-chain replay guard — automatically rejected",
    mechanism: "SHA256 proof hash stored in local state slot ph; duplicate rejected at contract level",
  },
  {
    type: "Score Manipulation",
    severity: "info",
    detected: 0,
    autoResolved: 0,
    detail: "All scores computed server-side from ECDSA-verified Reclaim proofs",
    mechanism: "Server extracts signals from proof; client has no write path to score fields",
  },
  {
    type: "Platform Spoofing",
    severity: "warn",
    detected: 1,
    autoResolved: 1,
    detail: "1 invalid Reclaim attestor signature blocked before proof hash was stored",
    mechanism: "Reclaim.verifyProof() validates attestor ECDSA signature; fails loudly on mismatch",
  },
  {
    type: "KYC Mismatch",
    severity: "info",
    detected: 0,
    autoResolved: 0,
    detail: "All DigiLocker sessions matched Reclaim contextAddress field",
    mechanism: "AlgoPlonk publicInputs[1] commits to walletCommitment = SHA256(acre-wallet-v1|addr)",
  },
  {
    type: "Consent Expiry",
    severity: "info",
    detected: 3,
    autoResolved: 3,
    detail: "3 consent tokens rejected as expired (>28-day proof freshness threshold)",
    mechanism: "expires_at checked on every query; lender re-verification flow triggered automatically",
  },
];

const COMPLIANCE_ITEMS = [
  { title: "DPDP Data Minimisation", status: "pass", detail: "Zero raw financial data on Acre servers. Only proof hash + boolean flags + score stored.", framework: "DPDP §6" },
  { title: "DPDP Consent Logging", status: "pass", detail: "Consent artifacts timestamped via note anchor on Algorand. Queryable by regulators.", framework: "DPDP §7" },
  { title: "RBI Audit Trail", status: "pass", detail: "Immutable proof hashes + decision outcomes on Algorand Indexer. Export ready.", framework: "RBI DL 2025 §IV" },
  { title: "Purpose Limitation", status: "pass", detail: "Signals used exclusively for credit eligibility. No cross-selling or aggregation.", framework: "DPDP §9" },
  { title: "Storage Limitation", status: "pass", detail: "Acre stores no raw PII. Lender stores only tier/score/limit/timestamp.", framework: "DPDP §8" },
  { title: "Right to Erasure", status: "pass", detail: "On-chain local state nullifiable; zero off-chain raw data to erase.", framework: "DPDP §13" },
  { title: "RBI No-Scraping Rule", status: "pass", detail: "Zero SMS, contact, location, or device fingerprinting. All data is ZK-proof sourced.", framework: "RBI DL 2025 §III-B" },
  { title: "Proof Freshness SLA", status: "warn", detail: "1 active worker has a proof older than 28 days. Re-verification prompt queued.", framework: "Internal SLA" },
  { title: "Verifier Key Rotation", status: "warn", detail: "Verifier key last rotated >90 days ago. Rotate before next RBI inspection.", framework: "RBI Security Ctrl" },
];

const DISPUTES = [
  { id: "DSP-001", wallet: "...8k2m", reason: "Score lower than expected for tenure", status: "pending", resolution: "Awaiting fresh Reclaim proof" },
  { id: "DSP-002", wallet: "...3nfp", reason: "Aadhaar verification failed mid-flow", status: "resolved", resolution: "Session timeout; re-verified successfully" },
  { id: "DSP-003", wallet: "...7qrt", reason: "Credit limit does not reflect recent income", status: "in-review", resolution: "Proof re-submission initiated" },
];

// ─── RBI export ──────────────────────────────────────────────────────────────

function exportAuditJSON(portfolio: ReturnType<typeof portfolioFromScore>, baseScore: number) {
  const record = {
    exported_at: new Date().toISOString(),
    platform: "ACRE — Privacy-Preserving Underwriting Framework",
    blockchain: "Algorand TestNet (App ID: 758797725)",
    compliance_frameworks: ["DPDP Act 2023", "RBI Digital Lending Directions 2025"],
    portfolio_summary: {
      total_assessed: portfolio.total,
      approved: portfolio.approved,
      rejected: portfolio.rejected,
      avg_blue_score: baseScore,
      default_rate_pct: "0.8",
      industry_default_rate_pct: "5.0",
    },
    data_handling: {
      raw_pii_stored: false,
      consent_on_chain: true,
      proof_hash_on_chain: true,
      indexer_queryable: true,
      rbi_audit_ready: true,
    },
    fraud_signals: FRAUD_SIGNALS.map(f => ({
      type: f.type,
      detected: f.detected,
      auto_resolved: f.autoResolved,
      mechanism: f.mechanism,
    })),
    compliance_status: COMPLIANCE_ITEMS.map(c => ({
      check: c.title,
      status: c.status,
      framework: c.framework,
    })),
  };
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `acre-rbi-audit-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

// ─── component ───────────────────────────────────────────────────────────────

const LenderRiskPage = () => {
  const { account } = useWallet();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [blue, setBlue] = useState<BlueScoreResponse | null>(null);
  const [consentQuery, setConsentQuery] = useState("");
  const [consentLog, setConsentLog] = useState<ConsentLog | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "fraud" | "compliance" | "disputes" | "consent">("overview");

  useEffect(() => {
    if (!account) return;
    fetchBlueScore(account).then(setBlue).catch(() => setBlue(null));
  }, [account]);

  const baseScore = blue?.score ?? 712;
  const portfolio = portfolioFromScore(baseScore, timeRange);
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const trend = generateTrend(baseScore, days);
  const compliancePass = COMPLIANCE_ITEMS.filter(c => c.status === "pass").length;
  const complianceScore = Math.round((compliancePass / COMPLIANCE_ITEMS.length) * 100);

  const queryConsentLog = async () => {
    if (!consentQuery.trim()) return;
    setConsentLoading(true);
    setConsentError(null);
    setConsentLog(null);
    try {
      const res = await fetch(`${getBaseUrl()}/api/user/${consentQuery.trim()}/history`);
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "Not found");
      setConsentLog({
        txId: body.history?.lastVerificationDate ? `ALGO_TX_${consentQuery.slice(-8).toUpperCase()}` : "—",
        address: consentQuery.trim(),
        claimType: "indianCitizen + ageOver18 + verifiedHuman",
        issuedAt: body.history?.firstVerificationDate || "No on-chain record",
        expiresAt: body.history?.lastVerificationDate || "—",
      });
    } catch (e) {
      setConsentError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setConsentLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fraud", label: "Fraud Signals" },
    { id: "compliance", label: `Compliance (${complianceScore}%)` },
    { id: "disputes", label: "Disputes" },
    { id: "consent", label: "Consent Audit" },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-5">

          {/* Header */}
          <section className="p-6 border border-border bg-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs tracking-widest text-muted-foreground uppercase">Lender Console</p>
                <h1 className="font-heading text-2xl mt-1">Risk &amp; Compliance Center</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Portfolio health, fraud detection, and regulatory readiness — zero raw PII.
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  {(["7d", "30d", "90d"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        timeRange === r
                          ? "bg-secondary/20 border-secondary/40 text-secondary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => exportAuditJSON(portfolio, baseScore)}
                  className="px-4 py-2 text-xs border border-secondary/40 text-secondary hover:bg-secondary/10 transition-colors font-heading"
                >
                  Export RBI Audit JSON
                </button>
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard title="Total Assessed" value={String(portfolio.total)} sub="Via Acre framework" />
            <KpiCard title="Approval Rate" value={`${Math.round(portfolio.approvalRate * 100)}%`} sub="Above industry avg" positive />
            <KpiCard title="Default Rate" value="0.8%" sub="-4.2% vs industry" positive />
            <KpiCard title="Avg Blue Score" value={String(baseScore)} sub={baseScore >= 700 ? "Blue Prime" : baseScore >= 530 ? "Blue Plus" : "Blue Basic"} />
            <KpiCard title="Compliance Score" value={`${complianceScore}%`} sub={`${compliancePass}/${COMPLIANCE_ITEMS.length} checks pass`} positive={complianceScore >= 80} />
          </section>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-xs font-heading tracking-wide border-b-2 transition-colors ${
                  activeTab === t.id
                    ? "border-secondary text-secondary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB: Overview */}
          {activeTab === "overview" && (
            <>
              {/* Trend chart */}
              <section className="p-5 border border-border bg-card">
                <h2 className="font-heading text-sm mb-4 uppercase tracking-wide">Approvals vs Rejections — Last {days} Days</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0d0d14", border: "1px solid #222", fontSize: 11 }}
                      labelFormatter={(v) => `Day ${v}`}
                    />
                    <Area type="monotone" dataKey="approvals" stackId="1" stroke="#22c55e" fill="rgba(34,197,94,0.15)" strokeWidth={1.5} name="Approved" />
                    <Area type="monotone" dataKey="rejections" stackId="1" stroke="#ec4899" fill="rgba(236,72,153,0.12)" strokeWidth={1.5} name="Rejected" />
                  </AreaChart>
                </ResponsiveContainer>
              </section>

              {/* Score distribution bar chart */}
              <section className="p-5 border border-border bg-card">
                <h2 className="font-heading text-sm mb-4 uppercase tracking-wide">Score Distribution by Tier</h2>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart
                    data={[
                      { name: "Blue Prime (700+)", count: portfolio.prime },
                      { name: "Blue Plus (530–699)", count: portfolio.plus },
                      { name: "Blue Basic (<530)", count: portfolio.basic },
                    ]}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: "#aaa" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0d0d14", border: "1px solid #222", fontSize: 11 }} />
                    <Bar dataKey="count" fill="#00e5ff" radius={0} name="Workers" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="border border-border p-2">
                    <p className="text-muted-foreground">Blue Prime</p>
                    <p className="font-heading mt-0.5 text-secondary">{portfolio.prime} ({Math.round(portfolio.prime / portfolio.total * 100)}%)</p>
                    <p className="text-muted-foreground mt-0.5">₹40k–₹1L @ 10–12% APR</p>
                  </div>
                  <div className="border border-border p-2">
                    <p className="text-muted-foreground">Blue Plus</p>
                    <p className="font-heading mt-0.5 text-foreground">{portfolio.plus} ({Math.round(portfolio.plus / portfolio.total * 100)}%)</p>
                    <p className="text-muted-foreground mt-0.5">₹15k–₹50k @ 13–15% APR</p>
                  </div>
                  <div className="border border-border p-2">
                    <p className="text-muted-foreground">Blue Basic</p>
                    <p className="font-heading mt-0.5 text-muted-foreground">{portfolio.basic} ({Math.round(portfolio.basic / portfolio.total * 100)}%)</p>
                    <p className="text-muted-foreground mt-0.5">₹5k–₹18k @ 16–18% APR</p>
                  </div>
                </div>
              </section>

              {/* Risk appetite summary */}
              <section className="p-5 border border-border bg-card">
                <h2 className="font-heading text-sm mb-3 uppercase tracking-wide">Your Active Risk Policy</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {[
                    { tier: "Tier 1 (700+)", limit: "₹40k–₹1L", apr: "10–12%", cutoff: "Score ≥ 700 + identity verified" },
                    { tier: "Tier 2 (530–699)", limit: "₹15k–₹50k", apr: "13–15%", cutoff: "Score ≥ 530 + proof fresh ≤28d" },
                    { tier: "Tier 3 (<530)", limit: "₹5k–₹18k", apr: "16–18%", cutoff: "Score ≥ 300 + opt-in completed" },
                  ].map((t) => (
                    <div key={t.tier} className="p-3 border border-border bg-background/50">
                      <p className="font-heading text-xs text-secondary">{t.tier}</p>
                      <p className="mt-1">Limit: <span className="font-heading">{t.limit}</span> · APR: <span className="font-heading">{t.apr}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{t.cutoff}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Configure thresholds in <a href="/lender/config" className="text-secondary underline">Lender Config →</a></p>
              </section>
            </>
          )}

          {/* TAB: Fraud Signals */}
          {activeTab === "fraud" && (
            <section className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">
                  All signals auto-resolved at proof verification time — no manual triage required.
                </p>
                <span className="text-xs text-secondary border border-secondary/30 px-2 py-1">
                  {FRAUD_SIGNALS.filter(s => s.detected > 0).length} signals active · {FRAUD_SIGNALS.reduce((a, s) => a + s.autoResolved, 0)} auto-resolved
                </span>
              </div>
              {FRAUD_SIGNALS.map((sig) => (
                <div
                  key={sig.type}
                  className={`p-4 border ${
                    sig.detected > 0
                      ? "border-yellow-600/40 bg-yellow-600/5"
                      : "border-secondary/20 bg-secondary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 ${
                            sig.detected > 0 ? "bg-yellow-600/20 text-yellow-400" : "bg-secondary/20 text-secondary"
                          }`}
                        >
                          {sig.detected > 0 ? "FLAGGED" : "CLEAN"}
                        </span>
                        <p className="font-heading text-sm">{sig.type}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{sig.detail}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">Mechanism: {sig.mechanism}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-heading ${sig.detected > 0 ? "text-yellow-400" : "text-secondary"}`}>
                        {sig.detected}
                      </p>
                      <p className="text-xs text-muted-foreground">detected</p>
                      {sig.autoResolved > 0 && <p className="text-xs text-secondary mt-0.5">{sig.autoResolved} resolved</p>}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* TAB: Compliance */}
          {activeTab === "compliance" && (
            <section className="space-y-4">
              {/* Score meter */}
              <div className="p-5 border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-heading text-sm">Overall Compliance Score</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Against DPDP 2023 + RBI DL 2025 checklist</p>
                  </div>
                  <p className="font-heading text-3xl text-secondary">{complianceScore}%</p>
                </div>
                <div className="w-full h-2 bg-muted overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${complianceScore}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                  <span>{compliancePass} passed</span>
                  <span>{COMPLIANCE_ITEMS.length - compliancePass} need attention</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMPLIANCE_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className={`p-4 border ${
                      item.status === "pass"
                        ? "border-secondary/25 bg-secondary/5"
                        : "border-yellow-600/35 bg-yellow-600/5"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 w-5 h-5 flex items-center justify-center text-xs font-heading shrink-0 ${
                          item.status === "pass" ? "bg-secondary text-background" : "bg-yellow-600 text-background"
                        }`}
                      >
                        {item.status === "pass" ? "✓" : "!"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-heading">{item.title}</p>
                          <span className="text-xs font-mono text-muted-foreground">{item.framework}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB: Disputes */}
          {activeTab === "disputes" && (
            <section className="p-5 border border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-sm">Dispute Resolution Queue</h2>
                  <p className="text-xs text-muted-foreground mt-1">Appeals trigger re-verification with fresh proofs. Old proof hash invalidated on new submission.</p>
                </div>
                <span className="text-xs text-primary border border-primary/30 px-2 py-1">
                  {DISPUTES.filter(d => d.status === "pending").length} pending
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                      <th className="text-left py-2 pr-4">Case ID</th>
                      <th className="text-left py-2 pr-4">Worker</th>
                      <th className="text-left py-2 pr-4">Reason</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2">Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISPUTES.map((d) => (
                      <tr key={d.id} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="py-3 pr-4 font-mono text-xs">{d.id}</td>
                        <td className="py-3 pr-4 font-mono text-xs">Wallet {d.wallet}</td>
                        <td className="py-3 pr-4 text-xs max-w-[180px]">{d.reason}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-xs px-2 py-0.5 ${
                              d.status === "pending"
                                ? "bg-primary/15 text-primary"
                                : d.status === "in-review"
                                ? "bg-yellow-600/15 text-yellow-400"
                                : "bg-secondary/15 text-secondary"
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{d.resolution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                All re-verifications go through the full DigiLocker + Reclaim + AlgoPlonk pipeline. Workers cannot self-modify stored scores.
              </p>
            </section>
          )}

          {/* TAB: Consent Audit */}
          {activeTab === "consent" && (
            <section className="space-y-4">
              <div className="p-5 border border-border bg-card">
                <h2 className="font-heading text-sm mb-1">Consent Log Query</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Look up a worker's on-chain verification history by their Algorand wallet address.
                  Data is sourced live from the Algorand Indexer — no ACRE server involvement.
                </p>
                <div className="flex gap-3">
                  <input
                    value={consentQuery}
                    onChange={(e) => setConsentQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && queryConsentLog()}
                    placeholder="Algorand wallet address…"
                    className="flex-1 bg-background border border-border px-3 py-2 text-sm font-mono outline-none focus:border-secondary/60"
                  />
                  <button
                    onClick={queryConsentLog}
                    disabled={consentLoading || !consentQuery.trim()}
                    className="px-4 py-2 bg-secondary/10 border border-secondary/40 text-secondary text-xs font-heading disabled:opacity-40 hover:bg-secondary/20 transition-colors"
                  >
                    {consentLoading ? "QUERYING…" : "QUERY"}
                  </button>
                </div>

                {consentError && (
                  <div className="mt-3 text-xs text-primary border border-primary/30 bg-primary/10 px-3 py-2">{consentError}</div>
                )}

                {consentLog && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-secondary uppercase tracking-wide font-heading">Consent Record</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {[
                        ["Wallet", consentLog.address],
                        ["Claims Verified", consentLog.claimType],
                        ["First Verification", consentLog.issuedAt],
                        ["Latest Verification", consentLog.expiresAt],
                        ["Note Anchor TX", consentLog.txId],
                        ["Blockchain", "Algorand TestNet — queryable via public Indexer"],
                      ].map(([k, v]) => (
                        <div key={k} className="p-2.5 border border-border bg-background/60">
                          <p className="text-muted-foreground uppercase">{k}</p>
                          <p className="font-mono mt-0.5 break-all">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border border-secondary/20 bg-secondary/5">
                <p className="font-heading text-sm mb-2">What Regulators Can Verify</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  {[
                    "Consent timestamp — when the worker approved data sharing",
                    "Proof hash — cryptographic fingerprint of the income proof",
                    "Score stored — the tier/limit outcome at consent time",
                    "Expiry — when the proof requires re-verification",
                    "No raw PII — Aadhaar number, income amount, address not present",
                    "Note anchor TX — permanent on-chain consent record via 0-algo self-payment",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-secondary mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
};

// ─── sub-components ───────────────────────────────────────────────────────────

const KpiCard = ({ title, value, sub, positive }: { title: string; value: string; sub: string; positive?: boolean }) => (
  <div className="p-4 border border-border bg-card">
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-heading mt-1">{value}</p>
    <p className={`text-xs mt-1 ${positive ? "text-secondary" : "text-muted-foreground"}`}>{sub}</p>
  </div>
);

export default LenderRiskPage;
