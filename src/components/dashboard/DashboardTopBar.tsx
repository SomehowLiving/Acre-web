import { motion } from "framer-motion";
import { useWallet, truncateAddress } from "@/contexts/WalletContext";
import { useEffect, useState } from "react";
import { fetchProofCount } from "@/lib/api";

const DashboardTopBar = () => {
  const { account, connectWallet, disconnectWallet } = useWallet();
  const [proofCount, setProofCount] = useState(0);

  useEffect(() => {
    fetchProofCount().then(setProofCount).catch(() => {});
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card">
      {/* Network status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-success"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-heading text-muted-foreground tracking-widest uppercase">
            Algorand Testnet
          </span>
        </div>
        <div className="w-[1px] h-4 bg-border" />
        <span className="text-xs text-muted-foreground mono-data">
          Round #34,291,048
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Proof count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-heading tracking-widest uppercase">Proofs</span>
          <span className="text-sm font-heading text-secondary mono-data">{proofCount}</span>
        </div>

        <div className="w-[1px] h-4 bg-border" />

        {/* Wallet */}
        {account ? (
          <button
            onClick={disconnectWallet}
            className="flex items-center gap-2 px-3 py-1.5 border border-border text-xs font-heading text-foreground tracking-wide hover:bg-muted transition-colors"
          >
            <div className="w-2 h-2 bg-primary" />
            <span className="mono-data">{truncateAddress(account)}</span>
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-3 py-1.5 border border-border text-xs font-heading text-foreground tracking-wide hover:bg-muted transition-colors"
          >
            <div className="w-2 h-2 bg-muted-foreground" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardTopBar;
