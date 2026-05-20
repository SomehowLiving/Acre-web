import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchBlueScore, type BlueScoreResponse } from "@/lib/api";

const BlueScorePage = () => {
  const { account } = useWallet();
  const [data, setData] = useState<BlueScoreResponse | null>(null);

  useEffect(() => {
    if (!account) return setData(null);
    fetchBlueScore(account).then(setData).catch(() => setData(null));
  }, [account]);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-6">
          <section className="p-6 border border-border bg-card">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">Blue Score Engine</p>
            <h1 className="font-heading text-3xl mt-2">BLUE SCORE</h1>
            <p className="text-sm text-muted-foreground mt-2">Acre is a privacy-preserving credit bureau for gig workers. Score is explainable, portable, and proof-backed.</p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric title="Score" value={String(data?.score ?? "—")} accent />
            <Metric title="Tier" value={data?.tier ?? "—"} />
            <Metric title="Eligibility" value={`₹${(data?.loanEligibility ?? 0).toLocaleString("en-IN")}`} />
            <Metric title="Proof Freshness" value={`${data?.scoreFreshnessDays ?? "—"} days`} />
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Explainable Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <BreakdownRow label="Income" bucket={data?.breakdown.income.bucket} points={data?.breakdown.income.points} />
              <BreakdownRow label="Consistency" bucket={data?.breakdown.consistency.bucket} points={data?.breakdown.consistency.points} />
              <BreakdownRow label="Rating" bucket={data?.breakdown.rating.bucket} points={data?.breakdown.rating.points} />
              <BreakdownRow label="Activity" bucket={data?.breakdown.activity.bucket} points={data?.breakdown.activity.points} />
            </div>
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-3">Pipeline Visibility</h2>
            <p className="text-sm text-muted-foreground">Identity Proof (DigiLocker) + Income Proof (Reclaim ZK) + Reputation Proof {"->"} Feature Extraction {"->"} Blue Score {"->"} Eligibility.</p>
          </section>
        </main>
      </div>
    </div>
  );
};

const Metric = ({ title, value, accent = false }: { title: string; value: string; accent?: boolean }) => (
  <div className="p-4 border border-border bg-card">
    <div className="text-xs text-muted-foreground uppercase tracking-widest">{title}</div>
    <div className={`mt-2 text-2xl font-heading ${accent ? "text-secondary" : "text-foreground"}`}>{value}</div>
  </div>
);

const BreakdownRow = ({ label, bucket, points }: { label: string; bucket?: string; points?: number }) => (
  <div className="p-3 border border-border bg-background/50 flex items-center justify-between">
    <div>
      <p className="font-heading text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">Bucket: {bucket ?? "—"}</p>
    </div>
    <p className="text-secondary font-heading">+{points ?? 0}</p>
  </div>
);

export default BlueScorePage;
