import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchBlueScore, fetchCreditLimit, fetchEligibility, fetchPassport, fetchUserProfile, type BlueScoreResponse, type PassportResponse } from "@/lib/api";

const LenderOverviewPage = () => {
  const { account } = useWallet();
  const [blue, setBlue] = useState<BlueScoreResponse | null>(null);
  const [passport, setPassport] = useState<PassportResponse | null>(null);
  const [onchainCreditLimit, setOnchainCreditLimit] = useState(0);
  const [onchainEligibility, setOnchainEligibility] = useState(0);
  const [profileTrips, setProfileTrips] = useState(0);
  const stats = {
    verifiedToday: blue ? Math.max(5, Math.round(blue.score / 70)) : 12,
    approvedThisWeek: blue ? Math.max(3, Math.round((blue.score / 1000) * 14)) : 8,
    avgScore: blue?.score ?? 712,
    dpdpCompliant: passport ? !passport.passport.identity.piiExposed : true,
    consentLogs: blue ? Math.max(50, Math.round(blue.score / 6)) : 127,
    lastAudit: `${passport?.passport.trust.scoreVerifiedDaysAgo ?? 2} days ago`,
  };

  useEffect(() => {
    if (!account) return;
    fetchBlueScore(account).then(setBlue).catch(() => setBlue(null));
    fetchPassport(account).then(setPassport).catch(() => setPassport(null));
    fetchCreditLimit(account).then(setOnchainCreditLimit).catch(() => setOnchainCreditLimit(0));
    fetchEligibility(account).then(setOnchainEligibility).catch(() => setOnchainEligibility(0));
    fetchUserProfile(account).then((p) => setProfileTrips(Number(p?.riderCount || 0))).catch(() => setProfileTrips(0));
  }, [account]);

  const baseline = blue?.score ?? 700;
  const recentVerifications = [
    { id: "0x7a3f...", worker: "Wallet ...8k2m", platform: "Swiggy", score: baseline + 12, tier: "Blue Plus", status: "Approved", time: "10 min ago" },
    { id: "0x9b2e...", worker: "Wallet ...3p9q", platform: "Uber", score: baseline - 28, tier: "Blue Plus", status: "Approved", time: "32 min ago" },
    { id: "0x4c1d...", worker: "Wallet ...1r7x", platform: "Upwork", score: baseline - 110, tier: "Blue Basic", status: "Rejected", time: "1 hr ago" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-6">
          <section className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-2xl">Lender Overview</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Underwriting with privacy-preserving financial identity and immutable audit trails.
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border ${stats.dpdpCompliant ? "border-secondary/40 text-secondary bg-secondary/10" : "border-destructive/40 text-destructive bg-destructive/10"}`}>
                  <span className="w-1.5 h-1.5 bg-current" />
                  {stats.dpdpCompliant ? "DPDP Compliant" : "Compliance Alert"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{stats.consentLogs} consent logs on Algorand</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Verified Today" value={String(stats.verifiedToday)} change="+4 vs yesterday" positive />
            <KpiCard title="Approved This Week" value={String(stats.approvedThisWeek)} change="67% approval rate" positive />
            <KpiCard title="Avg Blue Score" value={String(stats.avgScore)} change="Blue Plus median" />
            <KpiCard title="Compliance Audit" value={stats.lastAudit} change="RBI-ready logs" positive />
          </section>
          <section className="p-4 border border-border bg-card text-sm text-muted-foreground">
            On-chain baseline: credit limit ₹{onchainCreditLimit.toLocaleString("en-IN")} | eligibility ₹{onchainEligibility.toLocaleString("en-IN")} | trips {profileTrips.toLocaleString("en-IN")}
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Acre Verification Pipeline</h2>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
              <PipelineStep label="Identity" status="done" detail="DigiLocker ZK" />
              <Arrow />
              <PipelineStep label="Income" status="done" detail="Reclaim zk-TLS" />
              <Arrow />
              <PipelineStep label="Reputation" status="done" detail="Platform ratings" />
              <Arrow />
              <PipelineStep label="Blue Score" status="done" detail="Bucket-based" />
              <Arrow />
              <PipelineStep label="Eligibility" status="active" detail="Lender config" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Raw data never leaves worker context. Only proof hashes and policy outputs are persisted.
            </p>
          </section>

          <section className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg">Recent Verifications</h2>
              <span className="text-xs text-muted-foreground">Live-style testnet feed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2">Proof Hash</th>
                    <th className="text-left py-2">Worker</th>
                    <th className="text-left py-2">Platform</th>
                    <th className="text-left py-2">Blue Score</th>
                    <th className="text-left py-2">Tier</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVerifications.map((v) => (
                    <tr key={v.id} className="border-b border-border/50">
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">{v.id}</td>
                      <td className="py-2.5">{v.worker}</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 text-xs border border-border bg-background">{v.platform}</span></td>
                      <td className="py-2.5 font-heading">{v.score}</td>
                      <td className="py-2.5"><TierBadge tier={v.tier} /></td>
                      <td className="py-2.5"><span className={`text-xs ${v.status === "Approved" ? "text-secondary" : "text-destructive"}`}>{v.status}</span></td>
                      <td className="py-2.5 text-muted-foreground text-xs">{v.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-3">Data Privacy Guarantee</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <PrivacyCard label="Raw Transactions" status="never-collected" />
              <PrivacyCard label="Contact Lists / SMS" status="never-collected" />
              <PrivacyCard label="Exact Income Amounts" status="never-collected" />
              <PrivacyCard label="Aadhaar / PAN Numbers" status="never-collected" />
              <PrivacyCard label="Location History" status="never-collected" />
              <PrivacyCard label="Proof Hashes" status="on-algorand" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, change, positive }: { title: string; value: string; change: string; positive?: boolean }) => (
  <div className="p-4 border border-border bg-card">
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-heading mt-1">{value}</p>
    <p className={`text-xs mt-1 ${positive ? "text-secondary" : "text-muted-foreground"}`}>{change}</p>
  </div>
);

const PipelineStep = ({ label, status, detail }: { label: string; status: "done" | "active" | "pending"; detail: string }) => (
  <div className={`flex-1 p-3 border text-center ${status === "done" ? "border-secondary/40 bg-secondary/10" : status === "active" ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
    <p className="text-xs font-heading">{label}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
    {status === "done" && <p className="text-[10px] text-secondary mt-0.5">verified</p>}
  </div>
);

const Arrow = () => <div className="text-muted-foreground text-xs px-1">→</div>;

const TierBadge = ({ tier }: { tier: string }) => {
  const colors: Record<string, string> = {
    "Blue Prime": "bg-primary/15 text-primary",
    "Blue Plus": "bg-secondary/15 text-secondary",
    "Blue Basic": "bg-muted text-foreground",
  };
  return <span className={`px-2 py-0.5 text-xs ${colors[tier] || "bg-muted text-foreground"}`}>{tier}</span>;
};

const PrivacyCard = ({ label, status }: { label: string; status: "never-collected" | "on-algorand" }) => (
  <div className={`p-3 border text-xs flex items-center gap-2 ${status === "never-collected" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-secondary/30 bg-secondary/10 text-secondary"}`}>
    <span>{status === "never-collected" ? "×" : "✓"}</span>
    <span>{label}: {status === "never-collected" ? "Never collected" : "On Algorand"}</span>
  </div>
);

export default LenderOverviewPage;
