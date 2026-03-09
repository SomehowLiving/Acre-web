import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ProofVisualization from "./ProofVisualization";

// Staggered character reveal
const CharReveal = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.04,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block overflow-hidden"
          style={{ display: "inline-block" }}
        >
          <span className="inline-block">
            {char === " " ? "\u00A0" : char}
          </span>
        </motion.span>
      ))}
    </span>
  );
};

// Terminal input with blinking cursor
const TerminalInput = () => {
  const [typed, setTyped] = useState("");
  const fullText = "INITIATE PROOF";

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= fullText.length) {
          setTyped(fullText.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 80);
      return () => clearInterval(interval);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.5, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "left" }}
      className="border border-border bg-muted/30 flex items-center gap-3 px-4 py-3 max-w-sm cursor-pointer hover:border-primary transition-colors group"
    >
      <span className="mono-data text-xs text-muted-foreground select-none">$</span>
      <span className="mono-data text-sm text-foreground tracking-wider flex-1">
        {typed}
        <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
      </span>
      <span className="mono-data text-[10px] text-muted-foreground group-hover:text-primary transition-colors select-none">
        ENTER
      </span>
    </motion.div>
  );
};

const HeroSection = () => {
  return (
    <section className="relative h-screen flex overflow-hidden">
      {/* Left content — 60% */}
      <div className="relative w-full lg:w-[60%] flex flex-col justify-center px-8 md:px-16 lg:px-20 z-10">
        {/* Status line */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="h-px w-12 bg-primary" />
          <span className="mono-data text-[11px] text-primary tracking-[0.2em] uppercase">
            Protocol v1.0 — Active
          </span>
        </motion.div>

        {/* Headline */}
        <div className="mb-2 overflow-hidden">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-bold leading-[0.95] tracking-tight">
            <CharReveal text="INCOME" delay={0.4} />
          </h1>
        </div>
        <div className="mb-8 overflow-hidden">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-bold leading-[0.95] tracking-tight text-primary">
            <CharReveal text="VERIFIED" delay={0.7} />
          </h1>
        </div>

        {/* Subheadline */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-body text-base md:text-lg text-primary/80 max-w-lg leading-relaxed mb-10"
        >
          Zero-knowledge income attestation for India's gig economy
        </motion.p>

        {/* Terminal CTA */}
        <TerminalInput />

        {/* Bottom stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.4 }}
          className="flex items-center gap-6 mt-12 border-t border-border pt-6"
        >
          <div>
            <div className="mono-data text-[10px] text-muted-foreground tracking-widest">PROOF SIZE</div>
            <div className="mono-data text-sm text-foreground mt-1">192 bytes</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="mono-data text-[10px] text-muted-foreground tracking-widest">VERIFY TIME</div>
            <div className="mono-data text-sm text-foreground mt-1">&lt;200ms</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="mono-data text-[10px] text-muted-foreground tracking-widest">DATA EXPOSED</div>
            <div className="mono-data text-sm text-success mt-1">0 bytes</div>
          </div>
        </motion.div>
      </div>

      {/* Right visualization — 40% */}
      <div className="hidden lg:block w-[40%] relative border-l border-border">
        <div className="absolute inset-0 bg-card/50">
          <ProofVisualization />
        </div>
        {/* Label overlay */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-secondary animate-pulse" />
          <span className="mono-data text-[10px] text-muted-foreground tracking-widest uppercase">
            Live ZK Circuit
          </span>
        </div>
        <div className="absolute bottom-6 right-6">
          <span className="mono-data text-[10px] text-muted-foreground">
            groth16_bn254 &middot; 8s cycle
          </span>
        </div>
      </div>

      {/* Grid overlay for mobile (covers full width when viz is hidden) */}
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none lg:hidden" />
    </section>
  );
};

export default HeroSection;
