import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchBlueScore, fetchCreditLimit, fetchEligibility, fetchUserProfile, type BlueScoreResponse, type AcreHistory, type UserProfile } from "@/lib/api";

const BlueScorePage = () => {
  const { account } = useWallet();
  const [data, setData] = useState<BlueScoreResponse | null>(null);
  const [onchainCreditLimit, setOnchainCreditLimit] = useState(0);
  const [onchainEligibility, setOnchainEligibility] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!account) return setData(null);
    fetchBlueScore(account).then(setData).catch(() => setData(null));
    fetchCreditLimit(account).then(setOnchainCreditLimit).catch(() => setOnchainCreditLimit(0));
    fetchEligibility(account).then(setOnchainEligibility).catch(() => setOnchainEligibility(0));
    fetchUserProfile(account).then(setProfile).catch(() => setProfile(null));
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

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Active Credit & Next Milestone</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-border bg-background/50">
                <p className="text-xs text-muted-foreground uppercase">Current</p>
                <p className="font-heading mt-1">Model eligibility: ₹{(data?.creditLimit ?? data?.loanEligibility ?? 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Stored on-chain limit: ₹{(data?.onchain?.creditLimit ?? onchainCreditLimit).toLocaleString("en-IN")} · Trips: {Number((data?.onchain?.riderCount ?? profile?.riderCount) || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 border border-secondary/30 bg-secondary/5">
                <p className="text-xs text-secondary uppercase">Next Milestone</p>
                <p className="font-heading mt-1">Projected: ₹{Math.round((data?.creditLimit ?? data?.loanEligibility ?? onchainEligibility) * 1.4).toLocaleString("en-IN")} @ {data?.tier === "Blue Prime" ? "10–12" : "13–15"}% APR</p>
                <p className="text-xs text-muted-foreground mt-0.5">Unlock at Blue Prime (700+)</p>
                <p className="text-xs text-secondary mt-1">Need: +{Math.max(0, 700 - (data?.score || 0))} points from consistency/rating/activity gains</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric title="Score" value={String(data?.score ?? "—")} accent />
            <Metric title="Tier" value={data?.tier ?? "—"} />
            <Metric title="Model Eligibility" value={`₹${(data?.loanEligibility ?? 0).toLocaleString("en-IN")}`} />
            <Metric title="Proof Freshness" value={`${data?.scoreFreshnessDays ?? "—"} days`} />
          </section>

          <section className="p-6 border border-border bg-card">
            <h2 className="font-heading text-lg mb-4">Explainable Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <BreakdownRow
                label="Income Stability"
                weight={30}
                display={data?.signals?.earnings ? `₹${Math.round(data.signals.earnings / 1000)}k/mo` : "—"}
                contribution={data?.breakdown?.earnings?.contribution}
              />
              <BreakdownRow
                label="Consistency"
                weight={25}
                display={data?.signals?.tenure != null ? `${data.signals.tenure} months active` : "—"}
                contribution={data?.breakdown?.tenure?.contribution}
              />
              <BreakdownRow
                label="Platform Rating"
                weight={20}
                display={data?.signals?.rating ? `${data.signals.rating.toFixed(2)}★` : "—"}
                contribution={data?.breakdown?.rating?.contribution}
              />
              <BreakdownRow
                label="Activity Volume"
                weight={15}
                display={data?.signals?.trips ? `${data.signals.trips.toLocaleString("en-IN")} trips` : "—"}
                contribution={data?.breakdown?.activity?.contribution}
              />
              <BreakdownRow
                label="Completion Rate"
                weight={10}
                display={data?.signals?.completionRate ? `${data.signals.completionRate}%` : "—"}
                contribution={data?.breakdown?.reliability?.contribution}
              />
            </div>
            {data?.signals?.source && (
              <p className="text-xs text-muted-foreground mt-3">
                Signal source: <span className="font-mono">{data.signals.source}</span>
                {data.signals.source === "reclaim_proof" && " — from your submitted Reclaim proof"}
                {data.signals.source === "onchain_derived" && " — derived from on-chain proof data"}
                {data.signals.source === "deterministic_fallback" && " — deterministic from proof hash (no live Reclaim data yet)"}
                {data.signals.source === "address_seed" && " — preview only, submit a proof to get your real score"}
              </p>
            )}
          </section>

          {data?.history && (
            <AcreHistoryPanel history={data.history} />
          )}

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

const BreakdownRow = ({
  label,
  weight,
  display,
  contribution,
}: {
  label: string;
  weight: number;
  display: string;
  contribution?: number;
}) => (
  <div className="p-3 border border-border bg-background/50 flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="font-heading text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{display} · {weight}% weight</p>
    </div>
    <p className="text-secondary font-heading shrink-0">+{contribution ?? 0}</p>
  </div>
);

const AcreHistoryPanel = ({ history }: { history: AcreHistory }) => (
  <section className="p-6 border border-border bg-card">
    <h2 className="font-heading text-lg mb-4">ACRE Reputation History</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
      <div className="p-3 border border-border bg-background/50">
        <p className="text-xs text-muted-foreground uppercase">Verifications</p>
        <p className="font-heading mt-1 text-xl">{history.verificationCount}</p>
      </div>
      <div className="p-3 border border-border bg-background/50">
        <p className="text-xs text-muted-foreground uppercase">Months on ACRE</p>
        <p className="font-heading mt-1 text-xl">{history.acreMonths}</p>
      </div>
      <div className="p-3 border border-border bg-background/50">
        <p className="text-xs text-muted-foreground uppercase">Returning User</p>
        <p className={`font-heading mt-1 text-xl ${history.returning ? "text-secondary" : "text-muted-foreground"}`}>
          {history.returning ? "Yes (+20 pts)" : "No"}
        </p>
      </div>
      <div className="p-3 border border-border bg-background/50">
        <p className="text-xs text-muted-foreground uppercase">Last Verified</p>
        <p className="font-heading mt-1 text-sm">
          {history.daysSinceLastVerification != null
            ? `${history.daysSinceLastVerification}d ago`
            : "—"}
        </p>
      </div>
    </div>
    {history.firstVerificationDate && (
      <p className="text-xs text-muted-foreground">
        First verification: {history.firstVerificationDate}
        {history.lastVerificationDate && history.lastVerificationDate !== history.firstVerificationDate
          ? ` · Latest: ${history.lastVerificationDate}`
          : ""}
        {" · "}Sourced from Algorand Indexer — on-chain proof of repeated verification.
      </p>
    )}
    {!history.returning && (
      <p className="text-xs text-muted-foreground mt-2">
        Re-verify after 30+ days to earn the returning-user reputation bonus (+20 score pts).
      </p>
    )}
  </section>
);

export default BlueScorePage;
