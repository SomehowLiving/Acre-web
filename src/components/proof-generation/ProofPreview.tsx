import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProofValid, ShieldProof, AlgorandChain } from "@/components/ProofMarks";
import type { ProofData } from "@/pages/GenerateProof";
import { toast } from "@/hooks/use-toast";
import { fetchGrowth, fetchPassport, type GrowthResponse, type PassportResponse } from "@/lib/api";

interface ProofPreviewProps {
  proofData: ProofData;
  onBack: () => void;
}

export const ProofPreview: React.FC<ProofPreviewProps> = ({
  proofData,
  onBack,
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["public"]);
  const [simIncome, setSimIncome] = useState<"lt20" | "20to40" | "gt40">("20to40");
  const [simConsistency, setSimConsistency] = useState<"lt3" | "3to6" | "gt6">("3to6");
  const [simRating, setSimRating] = useState<"lt4" | "4to45" | "gt45">("4to45");
  const [simActivity, setSimActivity] = useState<"low" | "medium" | "high">("medium");
  const [activeInsightTab, setActiveInsightTab] = useState<"passport" | "goals">("passport");
  const [passportData, setPassportData] = useState<PassportResponse | null>(null);
  const [growthData, setGrowthData] = useState<GrowthResponse | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  // Already submitted if we have a txId from backend
  const isSubmitted = !!proofData.txId;
  const consistencyMonths = proofData.publicSignals.consistency_months;
  const baseIncomeBucket: "lt20" | "20to40" | "gt40" =
    proofData.tier && proofData.tier >= 3 ? "gt40" : "20to40";
  const baseConsistencyBucket: "lt3" | "3to6" | "gt6" =
    consistencyMonths > 6 ? "gt6" : consistencyMonths >= 3 ? "3to6" : "lt3";
  const baseRatingBucket: "lt4" | "4to45" | "gt45" = proofData.tier && proofData.tier >= 2 ? "gt45" : "4to45";
  const baseActivityBucket: "low" | "medium" | "high" = proofData.tier && proofData.tier >= 3 ? "high" : "medium";

  const points = {
    income: { lt20: 50, "20to40": 120, gt40: 200 },
    consistency: { lt3: 30, "3to6": 100, gt6: 180 },
    rating: { lt4: 40, "4to45": 100, gt45: 160 },
    activity: { low: 50, medium: 100, high: 150 },
  } as const;

  const baseScore =
    points.income[baseIncomeBucket] +
    points.consistency[baseConsistencyBucket] +
    points.rating[baseRatingBucket] +
    points.activity[baseActivityBucket];

  const simulatedScore =
    points.income[simIncome] +
    points.consistency[simConsistency] +
    points.rating[simRating] +
    points.activity[simActivity];

  const resolveTier = (score: number) => (score >= 800 ? "Blue Prime" : score >= 650 ? "Blue Plus" : "Blue Basic");
  const simulatedLoanLimit = simulatedScore >= 800 ? 50000 : simulatedScore >= 650 ? 35000 : 20000;
  const baseLoanLimit = baseScore >= 800 ? 50000 : baseScore >= 650 ? 35000 : 20000;

  useEffect(() => {
    const maybeAddress = proofData.walletAddress;
    if (!maybeAddress) return;
    let cancelled = false;
    Promise.all([fetchPassport(maybeAddress), fetchGrowth(maybeAddress)])
      .then(([passport, growth]) => {
        if (cancelled) return;
        setPassportData(passport);
        setGrowthData(growth);
      })
      .catch(() => {
        if (cancelled) return;
        setPassportData(null);
        setGrowthData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [proofData.walletAddress]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-wide text-foreground mb-2 flex items-center gap-3">
            <ProofValid size={28} state="success" />
            PROOF GENERATED
          </h1>
          <p className="text-muted-foreground text-sm">
            Review your zero-knowledge proof before submission
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">CIRCUIT</div>
          <div className="font-heading text-sm text-secondary mono-data">
            {proofData.circuit}
          </div>
        </div>
      </div>

      {/* Verification Result (from backend) */}
      {(proofData.tier !== undefined || proofData.creditLimit !== undefined) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-secondary/50 bg-secondary/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlgorandChain size={18} state="success" />
            <span className="font-heading text-sm tracking-wide text-secondary">VERIFICATION RESULT</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">TIER</div>
              <div className="font-heading text-lg text-foreground mono-data">{proofData.tier}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">CREDIT LIMIT</div>
              <div className="font-heading text-lg text-foreground mono-data">
                ₹{proofData.creditLimit?.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">TX ID</div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://lora.algokit.io/testnet/transaction/${proofData.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline break-all"
                >
                  {`${proofData.txId.slice(0, 16)}...`}
                </a>

                <button
                  onClick={() =>
                    copyToClipboard(proofData.txId, "Transaction ID")
                  }
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {proofData.identity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-primary/40 bg-primary/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldProof size={18} state="success" />
            <span className="font-heading text-sm tracking-wide text-primary">IDENTITY STATUS</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">REQUEST ID</div>
              <div className="font-mono text-xs break-all">{proofData.identity.requestId}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">STATUS</div>
              <div className="font-heading">{proofData.identity.status}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">INDIAN / 18+</div>
              <div className="font-heading">
                {proofData.identity.flags?.isIndian ? "Y" : "N"} / {proofData.identity.flags?.ageOver18 ? "Y" : "N"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">ALGOPLONK MODE</div>
              <div className="font-heading">{proofData.identity.algoplonkMode || "n/a"}</div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border border-border bg-card"
      >
        <div className="text-xs text-muted-foreground mb-2">FINANCIAL PASSPORT FLOW</div>
        <div className="text-sm leading-relaxed">
          Identity Proof (DigiLocker) + Income Proof (Reclaim ZK) + Reputation Proof (ratings) → Feature Extraction →{" "}
          <span className="font-heading text-secondary">Blue Score</span> → Loan Eligibility / Simulation
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border border-secondary/40 bg-secondary/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">BLUE SCORE</div>
            <div className="font-heading text-2xl text-secondary mono-data">{baseScore}</div>
            <div className="text-xs text-muted-foreground">{resolveTier(baseScore)}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            KYC: {proofData.identity?.status === "identity_verified" ? "Verified" : "Pending"} • No PII exposed
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 border border-border bg-background/60">Consistency: +{points.consistency[baseConsistencyBucket]}</div>
          <div className="p-3 border border-border bg-background/60">Income: +{points.income[baseIncomeBucket]}</div>
          <div className="p-3 border border-border bg-background/60">Rating: +{points.rating[baseRatingBucket]}</div>
          <div className="p-3 border border-border bg-background/60">Activity: +{points.activity[baseActivityBucket]}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border border-primary/40 bg-primary/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">WHAT-IF CREDIT SIMULATOR (PREVIEW)</div>
            <div className="font-heading text-xl">{simulatedScore} • {resolveTier(simulatedScore)}</div>
          </div>
          <div className="text-right text-sm">
            <div className="text-muted-foreground">Estimated Limit</div>
            <div className="font-heading mono-data">₹{simulatedLoanLimit.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Monthly Income</span>
            <select className="bg-background border border-border p-2" value={simIncome} onChange={(e) => setSimIncome(e.target.value as "lt20" | "20to40" | "gt40")}>
              <option value="lt20">&lt; ₹20k</option>
              <option value="20to40">₹20k - ₹40k</option>
              <option value="gt40">&gt; ₹40k</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Months Active</span>
            <select className="bg-background border border-border p-2" value={simConsistency} onChange={(e) => setSimConsistency(e.target.value as "lt3" | "3to6" | "gt6")}>
              <option value="lt3">&lt; 3 months</option>
              <option value="3to6">3-6 months</option>
              <option value="gt6">&gt; 6 months</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Platform Rating</span>
            <select className="bg-background border border-border p-2" value={simRating} onChange={(e) => setSimRating(e.target.value as "lt4" | "4to45" | "gt45")}>
              <option value="lt4">&lt; 4.0</option>
              <option value="4to45">4.0 - 4.5</option>
              <option value="gt45">&gt; 4.5</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Work Frequency</span>
            <select className="bg-background border border-border p-2" value={simActivity} onChange={(e) => setSimActivity(e.target.value as "low" | "medium" | "high")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <div className="text-xs text-muted-foreground">
          {simulatedLoanLimit > baseLoanLimit
            ? `If these improvements hold, estimated eligibility can increase from ₹${baseLoanLimit.toLocaleString("en-IN")} to ₹${simulatedLoanLimit.toLocaleString("en-IN")}.`
            : "Simulation preview only. Actual eligibility requires fresh proof submission."}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border bg-card overflow-hidden"
      >
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveInsightTab("passport")}
            className={`px-4 py-3 text-sm font-heading ${activeInsightTab === "passport" ? "bg-muted/40 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Passport
          </button>
          <button
            onClick={() => setActiveInsightTab("goals")}
            className={`px-4 py-3 text-sm font-heading ${activeInsightTab === "goals" ? "bg-muted/40 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Goals
          </button>
        </div>
        <div className="p-4 text-sm">
          {activeInsightTab === "passport" ? (
            passportData ? (
              <div className="space-y-3">
                <div>KYC Verified: {passportData.passport.identity.kycVerified ? "Yes" : "No"} • Identity Bonded: {passportData.passport.identity.identityBonded ? "Yes" : "No"}</div>
                <div>Fraud Risk: {passportData.passport.trust.fraudRisk} • Score verified {passportData.passport.trust.scoreVerifiedDaysAgo} days ago</div>
                <div>Proof freshness: expires in {passportData.passport.trust.incomeProofExpiryDays} days</div>
                <div className="text-xs text-muted-foreground">{passportData.pipeline.join(" -> ")}</div>
              </div>
            ) : (
              <div className="text-muted-foreground">Connect a wallet-backed proof to load Passport details.</div>
            )
          ) : growthData ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Verified Skills</div>
                <div>{growthData.skills.join(", ")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Recommendations</div>
                <div>{growthData.recommendations[0]}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Current Quest</div>
                <div>{growthData.quests[0]?.title} ({growthData.quests[0]?.progressMonths}/{growthData.quests[0]?.targetMonths} months) • Reward: {growthData.quests[0]?.reward}</div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Goals will appear once Passport data is available.</div>
          )}
        </div>
      </motion.div>

      {/* Proof Hash */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border border-border bg-card"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldProof size={18} state="success" />
            <span className="font-heading text-sm tracking-wide">PROOF HASH</span>
          </div>
          <button
            onClick={() => copyToClipboard(proofData.proofHash, "Proof hash")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            [COPY]
          </button>
        </div>
        <div className="font-mono text-xs text-foreground break-all bg-muted/30 p-3">
          {proofData.proofHash}
        </div>
      </motion.div>

      {/* Proof Structure */}
      <div className="border border-border bg-card overflow-hidden">
        {/* Public Signals */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("public")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 transition-transform ${expandedSections.includes("public") ? "rotate-90" : ""}`}>
                <svg viewBox="0 0 8 8" className="w-full h-full">
                  <path d="M2 1 L6 4 L2 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <span className="font-heading text-sm tracking-wide">PUBLIC_SIGNALS</span>
              <span className="text-xs text-secondary ml-2">(visible on-chain)</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Object.keys(proofData.publicSignals).length} fields
            </span>
          </button>
          <AnimatePresence>
            {expandedSections.includes("public") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-2">
                  <div className="bg-muted/20 p-4 font-mono text-xs">
                    <div className="text-muted-foreground">{"{"}</div>
                    <div className="pl-4">
                      <span className="text-primary">"income_band"</span>
                      <span className="text-muted-foreground">: </span>
                      <span className="text-secondary">"{proofData.publicSignals.income_band}"</span>
                      <span className="text-muted-foreground">,</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-primary">"consistency_months"</span>
                      <span className="text-muted-foreground">: </span>
                      <span className="text-foreground">{proofData.publicSignals.consistency_months}</span>
                      <span className="text-muted-foreground">,</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-primary">"timestamp"</span>
                      <span className="text-muted-foreground">: </span>
                      <span className="text-foreground">{proofData.publicSignals.timestamp}</span>
                    </div>
                    <div className="text-muted-foreground">{"}"}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Private Inputs */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("private")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 transition-transform ${expandedSections.includes("private") ? "rotate-90" : ""}`}>
                <svg viewBox="0 0 8 8" className="w-full h-full">
                  <path d="M2 1 L6 4 L2 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <span className="font-heading text-sm tracking-wide">PRIVATE_INPUTS</span>
              <span className="text-xs text-destructive ml-2">(never revealed)</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {proofData.privateInputs.length} fields
            </span>
          </button>
          <AnimatePresence>
            {expandedSections.includes("private") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-2">
                  <div className="bg-muted/20 p-4 font-mono text-xs">
                    <div className="text-muted-foreground">{"["}</div>
                    {proofData.privateInputs.map((input, i) => (
                      <div key={i} className="pl-4">
                        <span className="text-muted-foreground/50">{input}</span>
                        {i < proofData.privateInputs.length - 1 && (
                          <span className="text-muted-foreground">,</span>
                        )}
                      </div>
                    ))}
                    <div className="text-muted-foreground">{"]"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground italic">
                    Private inputs are cryptographically committed but never exposed
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Proof Metadata */}
        <div>
          <button
            onClick={() => toggleSection("meta")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 transition-transform ${expandedSections.includes("meta") ? "rotate-90" : ""}`}>
                <svg viewBox="0 0 8 8" className="w-full h-full">
                  <path d="M2 1 L6 4 L2 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <span className="font-heading text-sm tracking-wide">PROOF_METADATA</span>
            </div>
          </button>
          <AnimatePresence>
            {expandedSections.includes("meta") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">CIRCUIT</div>
                      <div className="mono-data">{proofData.circuit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">CONSTRAINTS</div>
                      <div className="mono-data">
                        {proofData.constraintsSatisfied}/{proofData.totalConstraints}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="px-6 py-2 font-heading text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          ← RECONFIGURE
        </button>

        {isSubmitted ? (
          <div className="flex items-center gap-3 px-6 py-2 bg-secondary/10 border border-secondary/30">
            <AlgorandChain size={18} state="success" />
            <span className="font-heading text-sm tracking-wider text-secondary">
              ANCHORED TO CHAIN
            </span>
          </div>
        ) : (
          <a
            href="/dashboard"
            className="px-6 py-2 font-heading text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <AlgorandChain size={16} />
            <span>VIEW DASHBOARD</span>
          </a>
        )}
      </div>
    </div>
  );
};
