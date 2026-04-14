import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProofValid, ShieldProof, AlgorandChain } from "@/components/ProofMarks";
import type { ProofData } from "@/pages/GenerateProof";
import { toast } from "@/hooks/use-toast";

interface ProofPreviewProps {
  proofData: ProofData;
  onBack: () => void;
}

export const ProofPreview: React.FC<ProofPreviewProps> = ({
  proofData,
  onBack,
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["public"]);

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
              <button
                onClick={() => proofData.txId && copyToClipboard(proofData.txId, "Transaction ID")}
                className="font-mono text-xs text-primary hover:underline break-all text-left"
              >
                {proofData.txId ? `${proofData.txId.slice(0, 16)}...` : "-"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

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
