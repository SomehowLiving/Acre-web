import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Proof {
  id: string;
  hash: string;
  timestamp: string;
  status: "verified" | "pending" | "expired";
}

const proofs: Proof[] = [
  { id: "1", hash: "0x8f3a...c7d1", timestamp: "2026-03-09 14:23", status: "verified" },
  { id: "2", hash: "0x2b91...a4e8", timestamp: "2026-03-08 09:11", status: "verified" },
  { id: "3", hash: "0xd47f...1b3c", timestamp: "2026-03-05 18:47", status: "pending" },
  { id: "4", hash: "0x6e02...f9a5", timestamp: "2026-02-28 12:00", status: "expired" },
  { id: "5", hash: "0xa1c8...3d7e", timestamp: "2026-02-20 08:33", status: "verified" },
];

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

const RecentProofsList = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-4 px-2">
        Recent Proofs
      </span>

      <div className="flex-1 overflow-y-auto space-y-[1px]">
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
