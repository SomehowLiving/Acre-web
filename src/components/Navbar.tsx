import { Link } from "react-router-dom";
import { ShieldProof } from "./ProofMarks";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <ShieldProof size={22} state="idle" />
          <span className="font-heading text-lg font-bold tracking-wider text-foreground">
            ACRE
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#protocol" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
            Protocol
          </a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
            Features
          </a>
          <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
            Architecture
          </a>
        </div>
        <Link to="/launch" className="border border-primary bg-primary/10 px-4 py-1.5 text-sm font-heading font-medium text-primary hover:bg-primary/20 transition-colors rounded-sm">
          Launch App
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
