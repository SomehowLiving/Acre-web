import { motion } from "framer-motion";

const CreditTierIndicator = () => {
  const currentTier = 2 as 1 | 2 | 3;
  const progressToNext = 0.65; // 65% to next tier

  const tierLabel = currentTier === 1 ? "TIER 1" : currentTier === 2 ? "TIER 2" : "TIER 3";

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase mb-4">
        Credit Tier
      </span>

      {/* Geometric badge */}
      <div className="relative w-24 h-24 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background shape (next tier — hexagon outline) */}
          <motion.polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="none"
            stroke="hsl(240 10% 15%)"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          {/* Current tier shape — square, filled progress */}
          <motion.rect
            x="20" y="20" width="60" height="60"
            fill="none"
            stroke="hsl(239 84% 67%)"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeDasharray="240"
            initial={{ strokeDashoffset: 240 }}
            animate={{ strokeDashoffset: 240 * (1 - progressToNext) }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          />
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="hsl(239 84% 67%)" />
        </svg>
      </div>

      <span className="text-sm font-heading text-foreground tracking-widest">{tierLabel}</span>
      <span className="text-xs text-muted-foreground mt-1 mono-data">{Math.round(progressToNext * 100)}% → Tier 3</span>
    </div>
  );
};

export default CreditTierIndicator;
