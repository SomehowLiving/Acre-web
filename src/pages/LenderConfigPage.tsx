import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import { fetchBlueScore, fetchCreditLimit, fetchEligibility, fetchUserProfile } from "@/lib/api";

const baseUrl = ((import.meta.env.VITE_BACKEND_VERIFY_URL as string) || "http://localhost:3001/verify-proof").replace(/\/(verify-proof|verify-worker-profile)\/?$/, "");

const LenderConfigPage = () => {
  const { account } = useWallet();
  const [minIncome, setMinIncome] = useState(25000);
  const [minMonths, setMinMonths] = useState(4);
  const [minRating, setMinRating] = useState(4.5);
  const [incomeWeight, setIncomeWeight] = useState(0.5);
  const [reputationWeight, setReputationWeight] = useState(0.5);
  const [out, setOut] = useState<{ approvedUsers: number; avgLoanTicketSize: number; riskEstimate: number } | null>(null);
  const [onchainCreditLimit, setOnchainCreditLimit] = useState(0);
  const [onchainEligibility, setOnchainEligibility] = useState(0);
  const [profileRating, setProfileRating] = useState(0);
  const [profileTrips, setProfileTrips] = useState(0);
  const [modules, setModules] = useState([
    { key: "income", label: "Income proof", enabled: true, required: true, weight: 0.3 },
    { key: "consistency", label: "Consistency proof", enabled: true, required: true, weight: 0.25 },
    { key: "rating", label: "Rating proof", enabled: true, required: false, weight: 0.2 },
    { key: "activity", label: "Activity proof", enabled: true, required: false, weight: 0.15 },
    { key: "identity", label: "Identity proof", enabled: true, required: true, weight: 0.1 },
  ]);

  useEffect(() => {
    if (!account) return;
    fetchCreditLimit(account).then(setOnchainCreditLimit).catch(() => setOnchainCreditLimit(0));
    fetchEligibility(account).then(setOnchainEligibility).catch(() => setOnchainEligibility(0));
    fetchUserProfile(account).then((p) => {
      setProfileRating(Number(p?.riderRating || 0) / 100);
      setProfileTrips(Number(p?.riderCount || 0));
    }).catch(() => {
      setProfileRating(0);
      setProfileTrips(0);
    });
    fetchBlueScore(account).then((blue) => {
      setMinIncome(Math.max(15000, Math.min(60000, Math.round(blue.features.monthlyIncome * 0.8))));
      setMinMonths(Math.max(1, Math.min(12, blue.features.consistencyMonths)));
      setMinRating(Math.max(3.5, Math.min(5, blue.features.rating)));
    }).catch(() => {});
  }, [account]);

  useEffect(() => {
    fetch(`${baseUrl}/api/lender/config/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minIncome, minConsistencyMonths: minMonths, minRating, incomeWeight, reputationWeight }),
    }).then((r) => r.json()).then((b) => setOut(b.outputs || null)).catch(() => setOut(null));
  }, [minIncome, minMonths, minRating, incomeWeight, reputationWeight]);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-6">
          <section className="p-6 border border-border bg-card">
            <h1 className="font-heading text-2xl">Lender Configuration Panel</h1>
            <p className="text-sm text-muted-foreground mt-2">Tune risk policy and see portfolio impact before deployment.</p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="p-5 border border-border bg-card space-y-4">
              <Control label={`Min income ₹${minIncome.toLocaleString("en-IN")}`}><input type="range" min={15000} max={60000} step={1000} value={minIncome} onChange={(e) => setMinIncome(Number(e.target.value))} className="w-full" /></Control>
              <Control label={`Min consistency ${minMonths} months`}><input type="range" min={1} max={12} step={1} value={minMonths} onChange={(e) => setMinMonths(Number(e.target.value))} className="w-full" /></Control>
              <Control label={`Min rating ${minRating.toFixed(1)}`}><input type="range" min={3.5} max={5} step={0.1} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full" /></Control>
              <Control label={`Income weight ${incomeWeight.toFixed(2)}`}><input type="range" min={0} max={1} step={0.05} value={incomeWeight} onChange={(e) => setIncomeWeight(Number(e.target.value))} className="w-full" /></Control>
              <Control label={`Reputation weight ${reputationWeight.toFixed(2)}`}><input type="range" min={0} max={1} step={0.05} value={reputationWeight} onChange={(e) => setReputationWeight(Number(e.target.value))} className="w-full" /></Control>
            </section>

            <section className="p-5 border border-border bg-card space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Portfolio Impact (Simulated)</p>
              <p className="text-sm">Approved users: <span className="font-heading">{out?.approvedUsers ?? "—"}</span></p>
              <p className="text-sm">Avg loan ticket size: <span className="font-heading">₹{(out?.avgLoanTicketSize ?? 0).toLocaleString("en-IN")}</span></p>
              <p className="text-sm">Risk estimate: <span className="font-heading">{out?.riskEstimate ?? "—"}</span></p>
              <p className="text-xs text-muted-foreground">Mock cohort analytics for policy calibration.</p>
            </section>
          </div>

          <section className="p-5 border border-border bg-card space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Proof Module Selection (Composable Bundle)</p>
            <div className="space-y-3">
              {modules.map((m, idx) => (
                <div key={m.key} className="p-3 border border-border bg-background/50 grid grid-cols-1 md:grid-cols-4 gap-3 items-center text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) => setModules((prev) => prev.map((x, i) => i === idx ? { ...x, enabled: e.target.checked } : x))}
                    />
                    <span>{m.label}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.required}
                      disabled={!m.enabled}
                      onChange={(e) => setModules((prev) => prev.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))}
                    />
                    <span>Required</span>
                  </label>
                  <div className="md:col-span-2">
                    <span className="text-xs text-muted-foreground">Weight {m.weight.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={m.weight}
                      disabled={!m.enabled}
                      onChange={(e) => setModules((prev) => prev.map((x, i) => i === idx ? { ...x, weight: Number(e.target.value) } : x))}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
              DPDP guardrail: raw transaction-history modules are disabled. Only proof-level signals are selectable.
            </div>
            <div className="p-3 border border-border bg-background/50 text-xs text-muted-foreground">
              Bundle preview: {modules.filter((m) => m.enabled).map((m) => `${m.label}${m.required ? " (required)" : " (optional)"}`).join(", ")}
            </div>
            <div className="p-3 border border-secondary/30 bg-secondary/10 text-xs text-muted-foreground">
              <p className="font-heading text-secondary mb-1">On-chain anchored baseline</p>
              <p>Credit limit (on-chain): ₹{onchainCreditLimit.toLocaleString("en-IN")} | Eligibility (on-chain): ₹{onchainEligibility.toLocaleString("en-IN")}</p>
              <p>Reputation inputs: rating {profileRating ? profileRating.toFixed(2) : "n/a"} | trips {profileTrips.toLocaleString("en-IN")}</p>
              <p className="mt-1">Formula: projected_limit = onchain_credit_limit × (1 + income_weight×0.2 + reputation_weight×0.15 + reputation_factor)</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const Control = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm mb-1">{label}</p>
    {children}
  </div>
);

export default LenderConfigPage;
