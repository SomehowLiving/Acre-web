import { AlgorandChain, ProofValid } from "./ProofMarks";
import SectionReveal from "./SectionReveal";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: "01",
    title: "Connect Platforms",
    description: "Link gig platform accounts via OAuth. Acre fetches earnings data locally — nothing leaves your device.",
  },
  {
    num: "02",
    title: "Generate ZK Proof",
    description: "Client-side proof generation using Groth16. Proves income exceeds a threshold without revealing the actual amount.",
  },
  {
    num: "03",
    title: "Anchor On-Chain",
    description: "Proof hash is anchored to Algorand as a verifiable attestation. Timestamped, immutable, publicly auditable.",
  },
  {
    num: "04",
    title: "Share Selectively",
    description: "Present your proof to verifiers — landlords, lenders, institutions. They verify cryptographically. No data exchanged.",
  },
];

const ArchitectureSection = () => {
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-60px" });

  return (
    <SectionReveal>
      <section id="architecture" className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="mono-data text-xs text-primary tracking-widest uppercase">
                Architecture
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              How the protocol works
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div ref={stepsRef} className="space-y-0">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ x: -30, opacity: 0 }}
                  animate={stepsInView ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative border-l border-border pl-8 pb-10 last:pb-0"
                >
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 border border-primary bg-background flex items-center justify-center">
                    <div className="w-1 h-1 bg-primary" />
                  </div>
                  <div className="mono-data text-xs text-primary mb-2">{step.num}</div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={stepsInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card border border-border p-8 relative scanline"
            >
              <div className="flex items-center gap-3 mb-6">
                <ProofValid size={20} state="scanning" />
                <span className="mono-data text-xs text-muted-foreground tracking-widest uppercase">
                  Proof Artifact
                </span>
              </div>

              <div className="space-y-4 mono-data text-sm">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">proof_type</span>
                  <span className="text-foreground">groth16_bn254</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">claim</span>
                  <span className="text-primary">income &gt;= threshold</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">data_exposed</span>
                  <span className="text-success">null</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">proof_size</span>
                  <span className="text-foreground">192 bytes</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">verify_time</span>
                  <span className="text-foreground">~180ms</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">chain</span>
                  <span className="text-foreground flex items-center gap-2">
                    <AlgorandChain size={16} />
                    algorand_mainnet
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">status</span>
                  <span className="text-primary">VERIFIED</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="mono-data text-[10px] text-muted-foreground break-all leading-relaxed">
                  0x7f4e2a...c3b91d &middot; block #38,291,044 &middot; 2026-03-09T14:22:01Z
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </SectionReveal>
  );
};

export default ArchitectureSection;
