import ScrollReveal from "./ScrollReveal";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <ScrollReveal>
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="mono-data text-xs text-muted-foreground">
            ACRE PROTOCOL &middot; 2026
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="mono-data text-xs text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="mono-data text-xs text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </a>
            <a href="#" className="mono-data text-xs text-muted-foreground hover:text-foreground transition-colors">
              Audit Report
            </a>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
};

export default Footer;
