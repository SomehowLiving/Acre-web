import { AlgorandChain, ProofValid } from "./ProofMarks";
import ScrollReveal from "./ScrollReveal";

const steps = [
  {
    num: "01",
    title: "Connect Platforms",
    description: "Link gig accounts via secure OAuth. Reclaim Protocol witnesses your login — encrypted data never visible to Acre.",
  },
  {
    num: "02",
    title: "Generate ZK Proof",
    description: "Zero-knowledge proof generated via Reclaim Protocol. Proves income tier without revealing exact earnings or transaction history.",
  },
  {
    num: "03",
    title: "Anchor On-Chain",
    description: "Proof attestation stored on Algorand. Immutable credit tier assigned — timestamped and publicly verifiable.",
  },
  {
    num: "04",
    title: "Share Selectively",
    description: "Lenders query your Algorand credit tier. Cryptographically verified. No raw data ever shared.",
  },
];

const ArchitectureSection = () => {
  return (
    <section id="architecture" className="relative py-24 border-t border-border">
      <div className="container mx-auto px-6">
        <ScrollReveal className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="mono-data text-xs text-primary tracking-widest uppercase">
              Architecture
            </span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            How the protocol works
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.12} direction="left">
                <div className="relative border-l border-border pl-8 pb-10 last:pb-0">
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
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Proof visualization */}
          <ScrollReveal direction="right" delay={0.2}>
            <div className="bg-card border border-border p-8 relative scanline">
              <div className="flex items-center gap-3 mb-6">
                <ProofValid size={20} state="scanning" />
                <span className="mono-data text-xs text-muted-foreground tracking-widest uppercase">
                  Proof Artifact
                </span>
              </div>

              <div className="space-y-4 mono-data text-sm">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">attestation_type</span>
                  <span className="text-foreground">Zero-Knowledge Proof</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">provider</span>
                  <span className="text-foreground">Reclaim Protocol</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">claim</span>
                  <span className="text-primary">Income Tier Verified</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">raw_data_exposed</span>
                  <span className="text-success">None</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">proof_size</span>
                  <span className="text-foreground">~200 bytes</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">verification_time</span>
                  <span className="text-foreground">&lt;200ms</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">chain</span>
                  <span className="text-foreground flex items-center gap-2">
                    <AlgorandChain size={16} />
                    Algorand Testnet
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
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
