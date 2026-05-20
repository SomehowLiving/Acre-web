import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

const LenderOverviewPage = () => (
  <div className="min-h-screen bg-background flex">
    <DashboardSidebar />
    <div className="flex-1 flex flex-col ml-[240px]">
      <DashboardTopBar />
      <main className="p-6 space-y-6">
        <section className="p-6 border border-border bg-card">
          <h1 className="font-heading text-2xl">Lender Overview</h1>
          <p className="text-sm text-muted-foreground mt-2">Underwriting with privacy-preserving financial identity, not raw personal data.</p>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Verified KYC" value="Gov-backed" note="No name/PAN/address exposed" />
          <Card title="Proof Freshness" value="2 days" note="Income proof expiry: 30 days" />
          <Card title="Fraud Risk" value="Low" note="Identity bonded + consistency checks" />
        </section>
        {/* <section className="p-6 border border-border bg-card text-sm text-muted-foreground">
          Pipeline: Identity Proof + Income Proof + Reputation Proof {"->"} Feature Extraction {"->"} Blue Score {"->"} Eligibility.
        </section> */}
      </main>
    </div>
  </div>
);

const Card = ({ title, value, note }: { title: string; value: string; note: string }) => (
  <div className="p-4 border border-border bg-card">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
    <p className="text-2xl font-heading mt-2">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{note}</p>
  </div>
);

export default LenderOverviewPage;
