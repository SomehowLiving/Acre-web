import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import ProofStatusModule from "@/components/dashboard/ProofStatusModule";
import IncomeAttestationGraph from "@/components/dashboard/IncomeAttestationGraph";
import CreditTierIndicator from "@/components/dashboard/CreditTierIndicator";
import RecentProofsList from "@/components/dashboard/RecentProofsList";
import { motion } from "framer-motion";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="flex-1 p-6">
          {/* Bento grid — asymmetric layout */}
          <div className="grid grid-cols-4 grid-rows-[auto] gap-[1px] bg-border/30">
            {/* Proof Status: 2x2 */}
            <BentoCell className="col-span-2 row-span-2" delay={0}>
              <ProofStatusModule />
            </BentoCell>

            {/* Credit Tier: 1x1 */}
            <BentoCell className="col-span-1 row-span-1" delay={0.1}>
              <CreditTierIndicator />
            </BentoCell>

            {/* Recent Proofs: 1x2 tall */}
            <BentoCell className="col-span-1 row-span-2" delay={0.15}>
              <RecentProofsList />
            </BentoCell>

            {/* Income Attestation: 2x1 wide + credit tier filler */}
            <BentoCell className="col-span-1 row-span-1" delay={0.2}>
              <div className="h-full flex flex-col items-center justify-center p-6">
                <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-2">Network</span>
                <span className="text-2xl font-heading text-foreground mono-data">ALGORAND</span>
                <span className="text-xs text-secondary mt-1 mono-data">TESTNET — ACTIVE</span>
                <div className="mt-4 w-full h-[1px] bg-border" />
                <div className="mt-4 grid grid-cols-2 gap-4 w-full text-center">
                  <div>
                    <span className="text-xs text-muted-foreground">Block</span>
                    <p className="text-sm font-heading text-foreground mono-data">34,291,047</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Round</span>
                    <p className="text-sm font-heading text-foreground mono-data">34,291,048</p>
                  </div>
                </div>
              </div>
            </BentoCell>

            {/* Income Attestation: spans 2 cols */}
            <BentoCell className="col-span-2 row-span-1" delay={0.25}>
              <IncomeAttestationGraph />
            </BentoCell>

            {/* Empty info cell */}
            <BentoCell className="col-span-2 row-span-1" delay={0.3}>
              <div className="h-full flex flex-col justify-center p-6">
                <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-3">Protocol Stats</span>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-2xl font-heading text-foreground mono-data">1,247</p>
                    <span className="text-xs text-muted-foreground">Total Proofs</span>
                  </div>
                  <div>
                    <p className="text-2xl font-heading text-secondary mono-data">99.2%</p>
                    <span className="text-xs text-muted-foreground">Verification Rate</span>
                  </div>
                  <div>
                    <p className="text-2xl font-heading text-foreground mono-data">0.003s</p>
                    <span className="text-xs text-muted-foreground">Avg Proof Time</span>
                  </div>
                </div>
              </div>
            </BentoCell>
          </div>
        </main>
      </div>
    </div>
  );
};

// Bento cell wrapper with border-draw animation and hover effect
const BentoCell = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    className={`relative bg-card overflow-hidden group ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -2, boxShadow: "4px 4px 0px 0px hsl(239 84% 67% / 0.15)" }}
  >
    {/* Border draw animation */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
      <motion.rect
        x="0" y="0" width="100%" height="100%"
        fill="none"
        stroke="hsl(240 10% 15%)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: delay + 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </svg>
    {children}
  </motion.div>
);

export default Dashboard;
