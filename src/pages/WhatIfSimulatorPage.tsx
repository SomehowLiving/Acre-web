import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { simulateBlueScore, type BlueScoreSimulationResponse } from "@/lib/api";

const WhatIfSimulatorPage = () => {
  const [income, setIncome] = useState(30000);
  const [months, setMonths] = useState(4);
  const [rating, setRating] = useState(4.4);
  const [activity, setActivity] = useState<"low" | "medium" | "high">("medium");
  const [result, setResult] = useState<BlueScoreSimulationResponse | null>(null);

  useEffect(() => {
    simulateBlueScore({ monthlyIncome: income, consistencyMonths: months, rating, activityLevel: activity })
      .then(setResult)
      .catch(() => setResult(null));
  }, [income, months, rating, activity]);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-6">
          <section className="p-6 border border-border bg-card">
            <h1 className="font-heading text-2xl">WHAT-IF CREDIT SIMULATOR (PREVIEW)</h1>
            <p className="text-sm text-muted-foreground mt-2">Preview how behavior changes Blue Score. Actual lending decisions still require fresh ZK proofs.</p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="p-5 border border-border bg-card space-y-4">
              <Range label="Monthly Income" value={`₹${income.toLocaleString("en-IN")}`}>
                <input type="range" min={10000} max={80000} step={1000} value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full" />
              </Range>
              <Range label="Months Active" value={`${months} months`}>
                <input type="range" min={1} max={24} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full" />
              </Range>
              <Range label="Platform Rating" value={rating.toFixed(1)}>
                <input type="range" min={3.5} max={5} step={0.1} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full" />
              </Range>
              <div>
                <p className="text-sm mb-1">Work Frequency</p>
                <select value={activity} onChange={(e) => setActivity(e.target.value as "low" | "medium" | "high")} className="w-full border border-border bg-background p-2 text-sm">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
            </section>

            <section className="p-5 border border-border bg-card space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Simulation Output</p>
              <p className="text-3xl font-heading text-secondary">{result?.score ?? "—"}</p>
              <p className="text-sm">Tier: <span className="font-heading">{result?.tier ?? "—"}</span></p>
              <p className="text-sm">Estimated eligibility: <span className="font-heading">₹{(result?.loanEligibility ?? 0).toLocaleString("en-IN")}</span></p>
              <div className="p-3 border border-secondary/30 bg-secondary/5 text-sm text-secondary">{result?.coachingMessage ?? "Adjust inputs to preview outcomes."}</div>
              <p className="text-xs text-muted-foreground">{result?.disclaimer ?? "Simulation preview only."}</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

const Range = ({ label, value, children }: { label: string; value: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm">{label}: <span className="font-heading">{value}</span></p>
    {children}
  </div>
);

export default WhatIfSimulatorPage;
