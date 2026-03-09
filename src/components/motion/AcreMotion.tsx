import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

/**
 * Acre Precision Mechanics — Motion Constants
 * All animations use cubic-bezier(0.4, 0, 0.2, 1)
 * NO spring physics, NO bouncy easing, NO playful overshoots
 */

export const ACRE_EASE = [0.4, 0, 0.2, 1] as const;
export const ACRE_MICRO = 0.15; // 150ms
export const ACRE_LAYOUT = 0.3; // 300ms
export const ACRE_PAGE = 0.8; // 800ms

export const acreTransition = {
  micro: { duration: ACRE_MICRO, ease: ACRE_EASE },
  layout: { duration: ACRE_LAYOUT, ease: ACRE_EASE },
  page: { duration: ACRE_PAGE, ease: ACRE_EASE },
};

/** Page transition variants — horizontal slide with content velocity */
export const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export const pageTransition = {
  duration: ACRE_PAGE,
  ease: ACRE_EASE,
};

/** Scan-reveal: content wipes in with horizontal line */
interface ScanRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScanReveal = ({ children, className, delay = 0 }: ScanRevealProps) => (
  <motion.div
    className={className}
    initial={{ clipPath: "inset(0 100% 0 0)" }}
    whileInView={{ clipPath: "inset(0 0% 0 0)" }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: ACRE_PAGE, delay, ease: ACRE_EASE }}
  >
    {children}
  </motion.div>
);

/** Success checkmark — SVG stroke draw animation */
export const SuccessCheck = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <motion.path
      d="M5 12l5 5L19 7"
      stroke="hsl(var(--success))"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
      style={{ strokeDasharray: 1, strokeDashoffset: 0 }}
    />
  </svg>
);

/** Particle burst from a point — signal cyan, 8-12 particles, dissipate quickly */
export const ParticleBurst = ({
  active,
  count = 10,
  color = "hsl(var(--secondary))",
  className,
}: {
  active: boolean;
  count?: number;
  color?: string;
  className?: string;
}) => (
  <AnimatePresence>
    {active && (
      <div className={`absolute inset-0 pointer-events-none ${className ?? ""}`}>
        {Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2;
          const dist = 30 + Math.random() * 20;
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1"
              style={{
                left: "50%",
                top: "50%",
                backgroundColor: color,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: 0,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
            />
          );
        })}
      </div>
    )}
  </AnimatePresence>
);

/** Circuit loader — SVG path that fills sequentially */
export const CircuitLoader = ({
  progress,
  className,
}: {
  progress: number; // 0-100
  className?: string;
}) => (
  <div className={`flex items-center gap-3 ${className ?? ""}`}>
    <svg width="120" height="8" viewBox="0 0 120 8" className="flex-shrink-0">
      <rect x="0" y="3" width="120" height="2" fill="hsl(var(--muted))" />
      <motion.rect
        x="0"
        y="3"
        height="2"
        fill="hsl(var(--secondary))"
        initial={{ width: 0 }}
        animate={{ width: (progress / 100) * 120 }}
        transition={{ duration: ACRE_MICRO, ease: ACRE_EASE }}
      />
      {/* Node dots at intervals */}
      {[0, 30, 60, 90, 120].map((x) => (
        <circle
          key={x}
          cx={x}
          cy="4"
          r="3"
          fill={progress >= (x / 120) * 100 ? "hsl(var(--secondary))" : "hsl(var(--muted))"}
          style={{ transition: `fill ${ACRE_MICRO}s` }}
        />
      ))}
    </svg>
    <span className="mono-data text-xs text-muted-foreground tabular-nums w-10 text-right">
      {Math.round(progress)}%
    </span>
  </div>
);

/** Success log entry — timestamped monospace green text */
export const SuccessLog = ({ message, className }: { message: string; className?: string }) => {
  const ts = new Date().toISOString().slice(11, 19);
  return (
    <motion.div
      className={`acre-log-entry ${className ?? ""}`}
      initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
    >
      <span className="text-muted-foreground">[{ts}]</span>{" "}
      <span>{message}</span>
    </motion.div>
  );
};

/** System alert overlay for error states */
export const SystemAlert = ({
  open,
  errorCode,
  message,
  onDismiss,
}: {
  open: boolean;
  errorCode: string;
  message: string;
  onDismiss: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
      >
        <motion.div
          className="border border-destructive p-8 max-w-md w-full bg-background"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-destructive" />
            <span className="font-heading text-sm tracking-widest text-destructive uppercase">
              SYSTEM ALERT
            </span>
          </div>
          <code className="mono-data text-xs text-muted-foreground block mb-2">
            ERR::{errorCode}
          </code>
          <p className="text-sm text-foreground mb-6">{message}</p>
          <button
            onClick={onDismiss}
            className="acre-btn border border-destructive px-4 py-2 text-xs font-heading tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            DISMISS
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
