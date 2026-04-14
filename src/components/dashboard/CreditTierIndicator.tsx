import { motion } from "framer-motion";

interface CreditTierIndicatorProps {
  tier?: number;
  creditLimit?: number;
}

const CreditTierIndicator = ({ tier, creditLimit }: CreditTierIndicatorProps) => {
  const currentTier = (tier || 1) as 1 | 2 | 3;
  const progressToNext = currentTier === 3 ? 1 : currentTier === 2 ? 0.65 : 0.3;

  const tierLabel = currentTier === 1 ? "TIER 1" : currentTier === 2 ? "TIER 2" : "TIER 3";
  const nextTierLabel = currentTier >= 3 ? "MAX" : `Tier ${currentTier + 1}`;

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
      <span className="text-xs text-muted-foreground mt-1 mono-data">
        {currentTier >= 3 ? "MAX TIER" : `${Math.round(progressToNext * 100)}% → ${nextTierLabel}`}
      </span>
      {creditLimit != null && (
        <span className="text-xs text-secondary mt-2 mono-data">₹{Number(creditLimit).toLocaleString()}</span>
      )}
    </div>
  );
};

export default CreditTierIndicator;
