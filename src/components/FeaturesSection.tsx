import {
  ShieldProof,
  ZeroKnowledge,
  IncomeStream,
  LockVerified,
  GigWorker,
  DataMinimal,
} from "./ProofMarks";
import SectionReveal from "./SectionReveal";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: <ZeroKnowledge size={32} state="idle" />,
    title: "Zero-Knowledge Proofs",
    description:
      "Attest to income thresholds without revealing amounts, sources, or transaction history. Mathematical certainty, zero disclosure.",
    tag: "ZK-SNARK",
  },
  {
    icon: <ShieldProof size={32} state="idle" />,
    title: "Cryptographic Attestations",
    description:
      "On-chain verifiable proofs anchored to Algorand. Tamper-proof, time-stamped, immutable.",
    tag: "ALGORAND",
  },
  {
    icon: <IncomeStream size={32} state="idle" />,
    title: "Multi-Platform Aggregation",
    description:
      "Aggregate earnings across gig platforms into a single privacy-preserving proof. Uber, DoorDash, Fiverr — unified.",
    tag: "AGGREGATE",
  },
  {
    icon: <GigWorker size={32} state="idle" />,
    title: "Gig Worker Native",
    description:
      "Built for non-traditional income. No W-2 required. No bank statements. Just cryptographic truth.",
    tag: "GIG-FIRST",
  },
  {
    icon: <LockVerified size={32} state="idle" />,
    title: "Selective Disclosure",
    description:
      "Granular control over what verifiers can see. Prove you earn above a threshold. Nothing more.",
    tag: "SELECTIVE",
  },
  {
    icon: <DataMinimal size={32} state="idle" />,
    title: "Data Minimization",
    description:
      "Raw financial data never leaves your device. Only the proof — a compact, verifiable artifact — is shared.",
    tag: "MINIMAL",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 30, opacity: 0, scale: 0.96 }}
      animate={isInView ? { y: 0, opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="bg-background p-8 group hover:bg-card transition-colors"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="group-hover:scale-110 transition-transform">
          {feature.icon}
        </div>
        <span className="mono-data text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-sm">
          {feature.tag}
        </span>
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
        {feature.title}
      </h3>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <SectionReveal>
      <section id="features" className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-secondary" />
              <span className="mono-data text-xs text-secondary tracking-widest uppercase">
                Protocol Features
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Engineered for privacy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>
    </SectionReveal>
  );
};

export default FeaturesSection;
