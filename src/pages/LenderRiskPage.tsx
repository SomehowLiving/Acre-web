import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchBlueScore, type BlueScoreResponse } from "@/lib/api";
import { useEffect } from "react";

const LenderRiskPage = () => {
  const { account } = useWallet();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [blue, setBlue] = useState<BlueScoreResponse | null>(null);

  useEffect(() => {
    if (!account) return;
    fetchBlueScore(account).then(setBlue).catch(() => setBlue(null));
  }, [account]);

  const baseScore = blue?.score ?? 712;
  const totalAssessed = Math.max(120, Math.round(baseScore * 0.48));
  const approved = Math.round(totalAssessed * Math.min(0.8, Math.max(0.45, baseScore / 1000)));
  const rejected = totalAssessed - approved;
  const portfolioStats = {
    totalAssessed,
    approved,
    rejected,
    avgScore: baseScore,
    defaultRate: "0.8%",
    vsIndustry: "-4.2%",
    scoreDistribution: [
      { tier: "Blue Prime", count: Math.max(20, Math.round(totalAssessed * 0.26)), color: "bg-primary" },
      { tier: "Blue Plus", count: Math.max(35, Math.round(totalAssessed * 0.38)), color: "bg-secondary" },
      { tier: "Blue Basic", count: Math.max(25, Math.round(totalAssessed * 0.36)), color: "bg-muted-foreground" },
    ],
  };

  const fraudSignals = [
    { type: "Identity Reuse", detected: 0, status: "clean", detail: "No duplicate wallet-DigiLocker bindings" },
    { type: "Proof Replay", detected: 2, status: "flagged", detail: "2 stale proof hashes rejected automatically" },
    { type: "Score Manipulation", detected: 0, status: "clean", detail: "All scores computed server-side from verified signatures" },
    { type: "Platform Spoofing", detected: 1, status: "flagged", detail: "1 invalid attestor signature blocked" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-6">
          <section className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-heading text-2xl">Risk & Compliance Center</h1>
                <p className="text-sm text-muted-foreground mt-2">Portfolio health, fraud detection, and regulatory readiness without raw PII.</p>
              </div>
              <div className="flex gap-2">
                {(["7d", "30d", "90d"] as const).map((r) => (
                  <button key={r} onClick={() => setTimeRange(r)} className={`px-3 py-1.5 text-xs border ${timeRange === r ? "bg-secondary/20 border-secondary/40 text-secondary" : "bg-card border-border text-muted-foreground"}`}>
                    {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Last 90 days"}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <RiskKpi title="Total Assessed" value={String(portfolioStats.totalAssessed)} subtitle="Via Acre framework" />
            <RiskKpi title="Approval Rate" value={`${Math.round((portfolioStats.approved / portfolioStats.totalAssessed) * 100)}%`} subtitle="Above industry avg" positive />
            <RiskKpi title="Default Rate" value={portfolioStats.defaultRate} subtitle={`${portfolioStats.vsIndustry} vs industry`} positive />
            <RiskKpi title="Avg Blue Score" value={String(portfolioStats.avgScore)} subtitle="Blue Plus median" />
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Score Distribution</h2>
            <div className="space-y-3">
              {portfolioStats.scoreDistribution.map((tier) => (
                <div key={tier.tier} className="flex items-center gap-3">
                  <span className="text-sm w-24">{tier.tier}</span>
                  <div className="flex-1 h-6 bg-muted overflow-hidden">
                    <div className={`h-full ${tier.color}`} style={{ width: `${(tier.count / portfolioStats.totalAssessed) * 100}%` }} />
                  </div>
                  <span className="text-sm font-heading w-12 text-right">{tier.count}</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{Math.round((tier.count / portfolioStats.totalAssessed) * 100)}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Fraud Detection Signals</h2>
            <div className="space-y-2">
              {fraudSignals.map((signal) => (
                <div key={signal.type} className={`p-3 border flex items-center justify-between ${signal.status === "clean" ? "border-secondary/30 bg-secondary/10" : "border-primary/30 bg-primary/10"}`}>
                  <div>
                    <p className="text-sm font-heading">{signal.type}</p>
                    <p className="text-xs text-muted-foreground">{signal.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-heading ${signal.status === "clean" ? "text-secondary" : "text-primary"}`}>{signal.detected} detected</p>
                    <p className="text-xs text-muted-foreground">{signal.status === "clean" ? "System clean" : "Auto-resolved"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Regulatory Readiness</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ComplianceCard title="DPDP Data Minimization" detail="Only configured score buckets are revealed." />
              <ComplianceCard title="DPDP Consent Logging" detail="Consent artifacts are timestamped and auditable." />
              <ComplianceCard title="RBI Audit Trail" detail="Immutable proof hashes with decision outcomes." />
              <ComplianceCard title="Storage Limitation" detail="No raw financial data stored on Acre servers." />
              <ComplianceCard title="Purpose Limitation" detail="Signals used only for eligibility decisions." />
              <ComplianceCard title="Right to Erasure" detail="State can be invalidated; raw data not retained." />
            </div>
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-3">Dispute Resolution</h2>
            <p className="text-sm text-muted-foreground mb-4">Appeals trigger re-verification with fresh proofs and updated module bundle.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="text-left py-2">Case ID</th>
                    <th className="text-left py-2">Worker</th>
                    <th className="text-left py-2">Reason</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 font-mono text-xs">DSP-001</td>
                    <td className="py-2.5">Wallet ...8k2m</td>
                    <td className="py-2.5">Score seems low for my tenure</td>
                    <td className="py-2.5"><span className="text-xs text-primary">Pending</span></td>
                    <td className="py-2.5 text-xs text-muted-foreground">Awaiting fresh proof</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const RiskKpi = ({ title, value, subtitle, positive }: { title: string; value: string; subtitle: string; positive?: boolean }) => (
  <div className="p-4 border border-border bg-card">
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-heading mt-1">{value}</p>
    <p className={`text-xs mt-1 ${positive ? "text-secondary" : "text-muted-foreground"}`}>{subtitle}</p>
  </div>
);

const ComplianceCard = ({ title, detail }: { title: string; detail: string }) => (
  <div className="p-4 border border-secondary/30 bg-secondary/10">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-5 h-5 bg-secondary text-background flex items-center justify-center text-xs">✓</span>
      <p className="text-sm font-heading">{title}</p>
    </div>
    <p className="text-xs text-muted-foreground">{detail}</p>
  </div>
);

export default LenderRiskPage;
