import { useNavigate } from "react-router-dom";
import { ShieldProof } from "@/components/ProofMarks";
import { motion } from "framer-motion";

const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="flex items-center justify-center gap-2 mb-10">
          <ShieldProof size={24} state="idle" />
          <span className="font-heading text-xl font-bold tracking-wider text-foreground">ACRE</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">Choose your role</h1>
        <p className="font-body text-sm text-muted-foreground text-center mb-10">
          Select how you want to use the protocol.
        </p>
        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => navigate("/dashboard")}
            className="border border-border bg-card p-6 text-left hover:border-primary/50 transition-colors"
          >
            <span className="font-heading text-sm tracking-widest text-primary uppercase">User</span>
            <p className="font-body text-sm text-muted-foreground mt-2">
              Generate zero-knowledge income proofs and manage your attestations.
            </p>
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => navigate("/verify")}
            className="border border-border bg-card p-6 text-left hover:border-primary/50 transition-colors"
          >
            <span className="font-heading text-sm tracking-widest text-primary uppercase">Lender</span>
            <p className="font-body text-sm text-muted-foreground mt-2">
              Verify applicant income attestations cryptographically.
            </p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
