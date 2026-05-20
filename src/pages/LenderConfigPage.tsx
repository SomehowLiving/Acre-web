import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

const baseUrl = ((import.meta.env.VITE_BACKEND_VERIFY_URL as string) || "http://localhost:3001/verify-proof").replace(/\/(verify-proof|verify-worker-profile)\/?$/, "");

const LenderConfigPage = () => {
  const [minIncome, setMinIncome] = useState(25000);
  const [minMonths, setMinMonths] = useState(4);
  const [minRating, setMinRating] = useState(4.5);
  const [incomeWeight, setIncomeWeight] = useState(0.5);
  const [reputationWeight, setReputationWeight] = useState(0.5);
  const [out, setOut] = useState<{ approvedUsers: number; avgLoanTicketSize: number; riskEstimate: number } | null>(null);

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
