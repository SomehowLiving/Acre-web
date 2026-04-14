import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Proof {
  id: string;
  hash: string;
  timestamp: string;
  status: "verified" | "pending" | "expired";
}

interface RecentProofsListProps {
  proofHash?: string;
  verified?: boolean;
  timestamp?: string;
}

const statusStyles: Record<string, string> = {
  verified: "text-secondary",
  pending: "text-warning",
  expired: "text-muted-foreground line-through",
};

const statusDotStyles: Record<string, string> = {
  verified: "bg-secondary",
  pending: "bg-warning",
  expired: "bg-muted-foreground",
};

const RecentProofsList = ({ proofHash, verified, timestamp }: RecentProofsListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build proofs list from backend data
  const proofs: Proof[] = [];
  if (proofHash && proofHash.length > 0) {
    const displayHash = proofHash.length > 16
      ? `0x${proofHash.slice(0, 4)}...${proofHash.slice(-4)}`
      : proofHash;
    const ts = timestamp
      ? new Date(Number(timestamp) * 1000).toISOString().replace("T", " ").slice(0, 16)
      : new Date().toISOString().replace("T", " ").slice(0, 16);
    proofs.push({
      id: "1",
      hash: displayHash,
      timestamp: ts,
      status: verified ? "verified" : "expired",
    });
  }

  const copyHash = (hash: string) => {
    const fullHash = proofHash || hash;
    navigator.clipboard.writeText(fullHash);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-4 px-2">
        Recent Proofs
      </span>

      <div className="flex-1 overflow-y-auto space-y-[1px]">
        {proofs.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-muted-foreground mono-data">No proofs found</span>
          </div>
        )}
        {proofs.map((proof) => (
          <div key={proof.id}>
            <button
              className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(expandedId === proof.id ? null : proof.id)}
            >
              {/* Status dot */}
              <motion.div
                className={`w-1.5 h-1.5 flex-shrink-0 ${statusDotStyles[proof.status]}`}
                animate={proof.status === "pending" ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              <div className="flex-1 min-w-0">
                <span className={`text-xs mono-data block ${statusStyles[proof.status]}`}>
                  {proof.hash}
                </span>
                <span className="text-[10px] text-muted-foreground">{proof.timestamp}</span>
              </div>

              {/* Expand indicator */}
              <motion.span
                className="text-muted-foreground text-xs"
                animate={{ rotate: expandedId === proof.id ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▸
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedId === proof.id && (
                <motion.div
                  className="px-2 pb-3 flex gap-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground mono-data transition-colors px-2 py-1 border border-border"
                    onClick={() => copyHash(proof.hash)}
                  >
                    copy hash
                  </button>
                  <button className="text-[10px] text-muted-foreground hover:text-foreground mono-data transition-colors px-2 py-1 border border-border">
                    view on explorer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProofsList;
