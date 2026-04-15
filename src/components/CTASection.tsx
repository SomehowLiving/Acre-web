import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const CTASection = () => {
  return (
    <section className="relative py-24 border-t border-border">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your income. Your proof. Your terms.
            </h2>
            <p className="font-body text-lg text-muted-foreground mb-10">
              Join the protocol. Generate your first zero-knowledge income attestation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="border border-primary bg-primary px-8 py-3 text-sm font-heading font-semibold text-primary-foreground hover:bg-primary/90 transition-colors rounded-sm hard-shadow">
                Start Proving
              </button>
              <button className="border border-border px-8 py-3 text-sm font-heading font-medium text-foreground hover:border-muted-foreground transition-colors rounded-sm">
                Read Whitepaper
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CTASection;
