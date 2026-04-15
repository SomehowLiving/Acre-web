import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldProof, ZeroKnowledge, ProofValid } from "./ProofMarks";

const HeroSection = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-40" />
      
      {/* Scanline effect */}
      <div className="absolute inset-0 scanline" />

      <div className="relative z-10 container mx-auto px-6 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Status line */}
          <div
            className={`flex items-center gap-3 mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="h-px w-8 bg-primary" />
            <span className="mono-data text-xs text-primary tracking-widest uppercase">
              Privacy-Preserving Income Verification
            </span>
          </div>

          {/* Main headline */}
          <h1
            className={`font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="text-foreground">Prove your</span>
            <br />
            <span className="text-foreground">income.</span>
            <br />
            <span className="text-primary">Reveal nothing.</span>
          </h1>

          {/* Subtext */}
          <p
            className={`font-body text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Cryptographic attestations for gig workers. Zero-knowledge proofs 
            of earning capacity — no raw financial data exposed. Ever.
          </p>

          {/* CTA row */}
          <div
            className={`flex flex-wrap gap-4 mb-16 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button className="border border-primary bg-primary px-6 py-3 text-sm font-heading font-semibold text-primary-foreground hover:bg-primary/90 transition-colors rounded-sm hard-shadow">
              Generate Proof
            </button>
            <button className="border border-border px-6 py-3 text-sm font-heading font-medium text-foreground hover:border-muted-foreground transition-colors rounded-sm">
              View Protocol Spec
            </button>
          </div>

          {/* Proof marks display */}
          <div
            className={`flex items-center gap-8 border-t border-border pt-8 transition-all duration-700 delay-[400ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-center gap-3">
              <ShieldProof size={20} state="scanning" />
              <div>
                <div className="mono-data text-xs text-muted-foreground">ZERO-KNOWLEDGE</div>
                <div className="mono-data text-sm text-foreground">Privacy-Preserving</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-3">
              <ZeroKnowledge size={20} state="scanning" />
              <div>
                <div className="mono-data text-xs text-muted-foreground">Raw Data Exposed</div>
                <div className="mono-data text-sm text-foreground">Zero</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <ProofValid size={20} state="scanning" />
              <div>
                <div className="mono-data text-xs text-muted-foreground">Proof Verification</div>
                <div className="mono-data text-sm text-foreground">&lt;200ms</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <ZeroKnowledge size={20} state="scanning" />
              <div>
                <div className="mono-data text-xs text-muted-foreground">Attestation Size</div>
                <div className="mono-data text-sm text-foreground">~200 bytes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
