import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchGrowth, fetchPassport, type GrowthResponse, type PassportResponse } from "@/lib/api";

const PassportGoalsPage = () => {
  const { account } = useWallet();
  const [passport, setPassport] = useState<PassportResponse | null>(null);
  const [growth, setGrowth] = useState<GrowthResponse | null>(null);

  useEffect(() => {
    if (!account) return;
    fetchPassport(account).then(setPassport).catch(() => setPassport(null));
    fetchGrowth(account).then(setGrowth).catch(() => setGrowth(null));
  }, [account]);

  const quest = growth?.quests?.[0];
  const pct = quest ? Math.min(100, Math.round((quest.progressMonths / quest.targetMonths) * 100)) : 0;
  const journey = passport?.journey || [];

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-6">
          <section className="p-6 border border-border bg-card">
            <h1 className="font-heading text-2xl">Passport and Goals</h1>
            <p className="text-sm text-muted-foreground mt-2">Financial Passport tracks trust. Goals turns trust signals into earning and credit milestones.</p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="p-5 border border-border bg-card space-y-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Passport Trust</p>
              <p>KYC Verified (Gov-backed): {passport?.passport.identity.kycVerified ? "Yes" : "—"}</p>
              <p>Same identity across sessions: {passport?.passport.identity.sameIdentityAcrossSessions ? "Yes" : "—"}</p>
              <p>PII exposed: {passport?.passport.identity.piiExposed ? "Yes" : "No"}</p>
              <p>Fraud risk: {passport?.passport.trust.fraudRisk ?? "—"}</p>
              <p>Score verified: {passport?.passport.trust.scoreVerifiedDaysAgo ?? "—"} days ago</p>
            </section>

            <section className="p-5 border border-border bg-card space-y-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Goals and Nudges</p>
              <p>Current quest: <span className="font-heading">{quest?.title ?? "—"}</span></p>
              <p>Reward: <span className="text-secondary">{quest?.reward ?? "—"}</span></p>
              <div className="h-2 bg-muted overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Progress: {quest ? `${quest.progressMonths}/${quest.targetMonths} months` : "—"}</p>
              <p>Verified skills: {growth?.skills?.join(", ") || "—"}</p>
              <p>Top recommendation: {growth?.recommendations?.[0] || "—"}</p>
            </section>
          </div>

          <section className="p-5 border border-border bg-card space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Work Journey (ZK-Verified)</p>
            <div className="relative pl-6 border-l-2 border-muted space-y-4">
              {journey.map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-secondary border-2 border-background" />
                  <div className="flex items-center justify-between">
                    <p className="font-heading text-sm">{step.platform}</p>
                    <span className="text-xs text-muted-foreground">{step.tenure}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.incomeBand} · {step.rating}★ · {step.completionRate}% completion
                  </p>
                  {step.growthFromPrevious && <p className="text-xs text-green-600 mt-0.5">+{step.growthFromPrevious}% growth</p>}
                </div>
              ))}
            </div>
            <div className="p-3 border border-border bg-background/50 text-xs text-muted-foreground">
              Cross-platform tenure: {passport?.totalTenureMonths ?? "—"} months · Income growth: {passport?.totalGrowth ?? "—"} · Reliability: {passport?.reliability ?? "—"}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PassportGoalsPage;
