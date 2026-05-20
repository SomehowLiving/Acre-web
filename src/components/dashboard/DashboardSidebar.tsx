import { useLocation, Link } from "react-router-dom";
import { ShieldProof, ProofValid, IncomeStream, GigWorker, DataMinimal } from "@/components/ProofMarks";

const navItems = [
  { label: "Passport Home", path: "/dashboard", icon: ShieldProof },
  { label: "BLUE SCORE", path: "/dashboard/blue-score", icon: IncomeStream },
  { label: "WHAT-IF CREDIT SIMULATOR (PREVIEW)", path: "/dashboard/simulator", icon: GigWorker },
  { label: "Passport and Goals", path: "/dashboard/passport-goals", icon: DataMinimal },
  { label: "Generate Attestation", path: "/generate", icon: ProofValid },
  { label: "Lender Overview", path: "/lender/overview", icon: ShieldProof },
  { label: "Lender Config", path: "/lender/config", icon: IncomeStream },
  { label: "Lender Risk", path: "/lender/risk", icon: GigWorker },
    { label: "Data Vault", path: "/verify", icon: DataMinimal },
];

const DashboardSidebar = () => {
  const location = useLocation();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col border-r border-border"
      style={{ backgroundColor: "#050508" }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <ShieldProof size={20} state="idle" />
          <span className="font-heading text-sm tracking-widest text-foreground uppercase">Acre</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-heading tracking-wide transition-colors ${
                isActive
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={18} state={isActive ? "success" : "idle"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-6 py-4 border-t border-border">
        <div className="text-xs text-muted-foreground mono-data">
          <p>Protocol v2.1.0</p>
          <p className="mt-1 text-secondary">ZK Attestation Circuit</p>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
