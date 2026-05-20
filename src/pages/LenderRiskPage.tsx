import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

const LenderRiskPage = () => (
  <div className="min-h-screen bg-background flex">
    <DashboardSidebar />
    <div className="flex-1 flex flex-col ml-[240px]">
      <DashboardTopBar />
      <main className="p-6 space-y-6">
        <section className="p-6 border border-border bg-card">
          <h1 className="font-heading text-2xl">Lender Risk</h1>
          <p className="text-sm text-muted-foreground mt-2">Trust and anti-fraud signals for safer underwriting decisions.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RiskCard title="Sybil Resistance" value="One Human = One Score" detail="Wallet + DigiLocker linkage" />
          <RiskCard title="Proof Freshness" value="Active" detail="Income proofs expire in 30 days" />
          <RiskCard title="Dispute Track" value="Available" detail="Appeal flow via re-submission" />
        </section>

        <section className="p-6 border border-border bg-card">
          <h2 className="font-heading text-lg mb-2">Fraud Controls</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Identity-bonded sessions across repeated verifications</li>
            <li>Score staleness warnings for expired data</li>
            <li>Consent-linked access trail for DPDP audit support</li>
          </ul>
        </section>
      </main>
    </div>
  </div>
);

const RiskCard = ({ title, value, detail }: { title: string; value: string; detail: string }) => (
  <div className="p-4 border border-border bg-card">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
    <p className="text-xl font-heading mt-2">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{detail}</p>
  </div>
);

export default LenderRiskPage;
