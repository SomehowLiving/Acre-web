import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CircuitParams, ProofData } from "@/pages/GenerateProof";

interface ProofGenerationProps {
  params: CircuitParams;
  onComplete: (data: ProofData) => void;
}

export const ProofGeneration: React.FC<ProofGenerationProps> = ({
  params,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [constraintsSatisfied, setConstraintsSatisfied] = useState(0);
  const [phase, setPhase] = useState<"setup" | "witness" | "proving" | "complete">("setup");
  const [hexagonPieces, setHexagonPieces] = useState<number[]>([]);
  const [isSealed, setIsSealed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const totalConstraints = 847;

  useEffect(() => {
    const runGeneration = async () => {
      // Phase 1: Setup
      setPhase("setup");
      await new Promise(r => setTimeout(r, 800));

      // Phase 2: Witness Generation
      setPhase("witness");
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 50));
        setProgress(i * 3.33);
        setConstraintsSatisfied(Math.floor((i / 30) * totalConstraints * 0.3));
      }

      // Phase 3: Proving
      setPhase("proving");
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 400));
        setHexagonPieces(prev => [...prev, i]);
        setProgress(30 + (i + 1) * 11.67);
        setConstraintsSatisfied(Math.floor(totalConstraints * (0.3 + (i + 1) * 0.1167)));
      }

      // Final
      await new Promise(r => setTimeout(r, 300));
      setConstraintsSatisfied(totalConstraints);
      setProgress(100);
      setIsSealed(true);
      
      // Particle burst
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 600);

      setPhase("complete");

      // Complete after animation
      await new Promise(r => setTimeout(r, 1000));

      const proofData: ProofData = {
        proofHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        publicSignals: {
          income_band: params.privacyLevel === "maximum" ? "REDACTED" : `>${Math.floor(params.incomeThreshold / 1000)}k`,
          consistency_months: params.consistencyPeriod,
          timestamp: Date.now(),
        },
        privateInputs: [
          "████████████████",
          "████████████████",
          "████████████████",
        ],
        circuit: "groth16_bn254",
        constraintsSatisfied: totalConstraints,
        totalConstraints,
      };

      onComplete(proofData);
    };

    runGeneration();
  }, [params, onComplete]);

  // Generate hexagon points
  const hexagonPath = (cx: number, cy: number, r: number, piece: number) => {
    const angle = (piece * 60 - 90) * (Math.PI / 180);
    const nextAngle = ((piece + 1) * 60 - 90) * (Math.PI / 180);
    
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(nextAngle);
    const y2 = cy + r * Math.sin(nextAngle);

    return `M${cx},${cy} L${x1},${y1} L${x2},${y2} Z`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
      {/* Background Circuit Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="circuit" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M0 10 L8 10 L8 0 M12 10 L20 10 M10 8 L10 0 M10 12 L10 20"
                stroke="hsl(var(--primary))"
                strokeWidth="0.3"
                fill="none"
              />
              <circle cx="10" cy="10" r="1" fill="hsl(var(--primary))" />
            </pattern>
          </defs>
          <motion.rect
            width="100%"
            height="100%"
            fill="url(#circuit)"
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-heading text-2xl tracking-widest text-foreground mb-2">
            PROOF GENERATION IN PROGRESS
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            {phase === "setup" && "Initializing trusted setup..."}
            {phase === "witness" && "Computing witness values..."}
            {phase === "proving" && "Generating zero-knowledge proof..."}
            {phase === "complete" && "Proof sealed successfully"}
          </p>
        </motion.div>

        {/* Hexagon Assembly */}
        <div className="relative w-64 h-64 mx-auto mb-12">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background hexagon outline */}
            <motion.polygon
              points="100,20 170,55 170,125 100,160 30,125 30,55"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
            />

            {/* Assembling pieces */}
            {hexagonPieces.map((piece) => (
              <motion.path
                key={piece}
                d={hexagonPath(100, 90, 70, piece)}
                fill={`hsl(var(--primary) / ${0.15 + piece * 0.05})`}
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            ))}

            {/* Center seal */}
            <AnimatePresence>
              {isSealed && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <circle cx="100" cy="90" r="20" fill="hsl(var(--secondary))" />
                  <motion.path
                    d="M90 90 L97 97 L112 82"
                    stroke="hsl(var(--background))"
                    strokeWidth="3"
                    strokeLinecap="square"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                </motion.g>
              )}
            </AnimatePresence>
          </svg>

          {/* Particle Burst */}
          <AnimatePresence>
            {showParticles && (
              <>
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30) * (Math.PI / 180);
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-secondary"
                      style={{
                        left: "50%",
                        top: "50%",
                      }}
                      initial={{ x: -4, y: -4, opacity: 1 }}
                      animate={{
                        x: Math.cos(angle) * 80 - 4,
                        y: Math.sin(angle) * 80 - 4,
                        opacity: 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  );
                })}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Stats */}
        <div className="space-y-4">
          {/* Constraints Counter */}
          <motion.div
            className="font-heading text-lg tracking-wide"
            animate={phase === "complete" ? { color: "hsl(var(--secondary))" } : {}}
          >
            <span className="text-muted-foreground">Constraints satisfied: </span>
            <span className="mono-data text-foreground">
              {constraintsSatisfied}/{totalConstraints}
            </span>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-80 mx-auto">
            <div className="h-1 bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Setup</span>
              <span>Witness</span>
              <span>Proving</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Phase indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {["setup", "witness", "proving", "complete"].map((p) => (
              <div
                key={p}
                className={`w-2 h-2 transition-colors ${
                  phase === p
                    ? "bg-primary"
                    : ["setup", "witness", "proving", "complete"].indexOf(p) <
                      ["setup", "witness", "proving", "complete"].indexOf(phase)
                    ? "bg-secondary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
