import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const TOTAL_DOTS = 60;

const ProofStatusModule = () => {
  const [filledDots, setFilledDots] = useState(0);
  const proofState = "VERIFIED" as "GENERATING" | "VERIFIED" | "EXPIRED";
  const daysUntilExpiry = 14;

  // Animate dots filling on mount
  useEffect(() => {
    const target = proofState === "VERIFIED" ? TOTAL_DOTS : proofState === "GENERATING" ? 38 : 0;
    const interval = setInterval(() => {
      setFilledDots((prev) => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return prev + 1;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [proofState]);

  const stateColor = proofState === "VERIFIED"
    ? "text-secondary"
    : proofState === "GENERATING"
      ? "text-warning"
      : "text-muted-foreground";

  const dotColor = (i: number) => {
    if (i >= filledDots) return "bg-muted";
    if (proofState === "VERIFIED") return "bg-secondary";
    if (proofState === "GENERATING") return "bg-warning";
    return "bg-muted-foreground";
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-6">
        Proof Status
      </span>

      {/* Circular dot progress */}
      <div className="relative w-48 h-48 mb-6">
        {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
          const angle = (i / TOTAL_DOTS) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 45 * Math.cos(rad);
          const y = 50 + 45 * Math.sin(rad);
          return (
            <motion.div
              key={i}
              className={`absolute w-1.5 h-1.5 ${dotColor(i)}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
            />
          );
        })}

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-heading text-foreground mono-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {daysUntilExpiry}
          </motion.span>
          <span className="text-xs text-muted-foreground mt-1">days remaining</span>
        </div>
      </div>

      {/* State label */}
      <motion.div
        className={`flex items-center gap-2 ${stateColor}`}
        animate={proofState === "GENERATING" ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className={`w-2 h-2 ${proofState === "VERIFIED" ? "bg-secondary" : proofState === "GENERATING" ? "bg-warning" : "bg-muted-foreground"}`} />
        <span className="text-sm font-heading tracking-widest">{proofState}</span>
      </motion.div>

      {/* Renew command */}
      {proofState !== "GENERATING" && (
        <button className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors mono-data">
          {proofState === "EXPIRED" ? "$ acre renew --force" : "$ acre renew --proof-id=latest"}
        </button>
      )}
    </div>
  );
};

export default ProofStatusModule;
