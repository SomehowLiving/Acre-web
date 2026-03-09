import { motion } from "framer-motion";
import { useState } from "react";

const months = [
  { label: "Oct", value: 38500 },
  { label: "Nov", value: 42500 },
  { label: "Dec", value: 35000 },
  { label: "Jan", value: 51200 },
  { label: "Feb", value: 44800 },
  { label: "Mar", value: 47300 },
];

const maxVal = Math.max(...months.map((m) => m.value));

const intensityClass = (value: number) => {
  const ratio = value / maxVal;
  if (ratio > 0.85) return "bg-primary";
  if (ratio > 0.7) return "bg-primary/80";
  if (ratio > 0.55) return "bg-primary/60";
  if (ratio > 0.4) return "bg-primary/40";
  return "bg-primary/25";
};

const IncomeAttestationGraph = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="h-full flex flex-col p-6">
      <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-4">
        Income Attestation — 6M
      </span>

      <div className="flex-1 flex items-end gap-[2px]">
        {months.map((month, i) => {
          const heightPct = (month.value / maxVal) * 100;
          return (
            <div
              key={month.label}
              className="flex-1 flex flex-col items-center gap-2 relative"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {hoveredIndex === i && (
                <motion.div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-card border border-border text-xs mono-data text-secondary whitespace-nowrap z-20"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {">"} ₹{month.value.toLocaleString()}
                </motion.div>
              )}

              {/* Heat strip */}
              <motion.div
                className={`w-full ${intensityClass(month.value)} transition-colors`}
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ minHeight: 8 }}
              />
              <span className="text-[10px] text-muted-foreground font-heading tracking-wider">
                {month.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncomeAttestationGraph;
