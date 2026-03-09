import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShieldProof, ProofValid, AlgorandChain } from "@/components/ProofMarks";
import { useToast } from "@/hooks/use-toast";

type VerificationState = "validating" | "valid" | "invalid" | "expired";

const MOCK_PROOF = {
  hash: "0x7a4f8b2c1e9d3f6a5b8c7d4e2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2",
  circuitVersion: "groth16_bn254_v2.1.0",
  verificationKey: "vk_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c",
  timestamp: "2026-03-09T14:32:18Z",
  blockNumber: 38_847_291,
  applicant: {
    walletAddress: "ALGO7X4F8B2C1E9D3F6A5B8C7D4E2F1A9B8C7D6E5F4A3B",
    creditTier: 2 as 1 | 2 | 3,
    incomeBand: "₹40k–₹70k",
    consistencyMonths: 6,
    loansRepaid: 3,
  },
};

const tierShape = (tier: 1 | 2 | 3, lit: boolean) => {
  const stroke = lit ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))";
  const fill = lit ? "hsl(var(--secondary) / 0.15)" : "none";
  if (tier === 1)
    return <polygon points="12,2 22,20 2,20" stroke={stroke} fill={fill} strokeWidth="1.5" strokeLinejoin="miter" />;
  if (tier === 2)
    return <rect x="3" y="3" width="18" height="18" stroke={stroke} fill={fill} strokeWidth="1.5" strokeLinejoin="miter" />;
  return <polygon points="12,2 21,6.5 21,17.5 12,22 3,17.5 3,6.5" stroke={stroke} fill={fill} strokeWidth="1.5" strokeLinejoin="miter" />;
};

const LenderVerification = () => {
  const [state, setState] = useState<VerificationState>("validating");
  const [litRows, setLitRows] = useState<number>(0);
  const { toast } = useToast();

  // Simulate verification
  useEffect(() => {
    const t = setTimeout(() => setState("valid"), 2200);
    return () => clearTimeout(t);
  }, []);

  // Sequential light-up after valid
  useEffect(() => {
    if (state !== "valid") return;
    const total = 5;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setLitRows(i);
      if (i >= total) clearInterval(iv);
    }, 150); // Matches ACRE_MICRO (150ms)
    return () => clearInterval(iv);
  }, [state]);

  const copyHash = () => {
    navigator.clipboard.writeText(MOCK_PROOF.hash);
    toast({ title: "Hash copied", description: MOCK_PROOF.hash.slice(0, 24) + "…" });
  };

  const isValid = state === "valid";
  const isInvalid = state === "invalid";
  const isExpired = state === "expired";
  const isPending = state === "validating";

  const stateColor = isValid
    ? "text-secondary"
    : isInvalid
      ? "text-destructive"
      : isExpired
        ? "text-muted-foreground"
        : "text-warning";

  const stateBg = isValid
    ? "border-secondary/40"
    : isInvalid
      ? "border-destructive/40"
      : isExpired
        ? "border-muted-foreground/30"
        : "border-warning/40";

  const rowLit = (idx: number) => isValid && litRows > idx;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Invalid overlay noise */}
      {isInvalid && (
        <div className="fixed inset-0 z-50 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* LEFT PANEL */}
      <div className="flex-1 border-r border-border p-8 flex flex-col">
        <span className="text-xs font-heading tracking-widest text-muted-foreground uppercase mb-8">
          Proof Verification
        </span>

        {/* Verification Badge */}
        <div className={`border ${stateBg} p-6 mb-6 relative overflow-hidden`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center">
              {isPending && (
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, ease: ACRE_EASE }}>
                  <ShieldProof size={48} state="scanning" />
                </motion.div>
              )}
              {isValid && <ShieldProof size={48} state="success" />}
              {isInvalid && <ShieldProof size={48} state="error" />}
              {isExpired && <ShieldProof size={48} />}
            </div>
            <div>
              <h2 className={`text-2xl font-heading tracking-wider uppercase ${stateColor}`}>
                {isPending ? "VALIDATING…" : state.toUpperCase()}
              </h2>
              <p className="text-xs text-muted-foreground mono-data mt-1">
                {isPending ? "Checking cryptographic constraints" : isValid ? "All constraints satisfied" : isInvalid ? "Constraint violation detected" : "Proof attestation has expired"}
              </p>
            </div>
          </div>

          {/* Circuit trace lines */}
          {isValid && (
            <motion.div
              className="absolute left-8 bottom-0 w-px bg-secondary"
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: ACRE_LAYOUT, delay: 0.2, ease: ACRE_EASE }}
              style={{ filter: "drop-shadow(0 0 4px hsl(var(--secondary)))" }}
            />
          )}
          {isInvalid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <motion.line x1="0" y1="0" x2="100%" y2="100%" stroke="hsl(var(--destructive))" strokeWidth="1"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }} />
              <motion.line x1="100%" y1="0" x2="0" y2="100%" stroke="hsl(var(--destructive))" strokeWidth="1"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: ACRE_LAYOUT, delay: 0.1, ease: ACRE_EASE }} />
            </svg>
          )}
        </div>

        {/* Proof Hash */}
        <div className={`border border-border p-4 mb-6 transition-opacity duration-layout ease-acre ${isInvalid ? "opacity-30" : ""}`}>
          <span className="text-xs text-muted-foreground tracking-widest uppercase block mb-2">Proof Hash</span>
          <div className="flex items-center gap-2">
            <code className="mono-data text-sm text-foreground break-all flex-1">
              {MOCK_PROOF.hash}
            </code>
            <button onClick={copyHash} className="text-muted-foreground hover:text-secondary acre-link transition-colors duration-micro ease-acre p-1">
              <Copy size={14} />
            </button>
            <a href={`https://testnet.algoexplorer.io/tx/${MOCK_PROOF.hash}`} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-secondary transition-colors p-1">
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Cryptographic Details */}
        <CryptoDetails proof={MOCK_PROOF} isInvalid={isInvalid} />

        <div className="mt-auto" />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-8 flex flex-col">
        <span className="text-xs font-heading tracking-widest text-muted-foreground uppercase mb-8">
          Applicant Summary
        </span>

        <div className="space-y-4">
          <DataRow label="ANONYMOUS ID" lit={rowLit(0)} invalid={isInvalid}>
            <code className="mono-data text-sm">
              {MOCK_PROOF.applicant.walletAddress.slice(0, 8)}…{MOCK_PROOF.applicant.walletAddress.slice(-6)}
            </code>
          </DataRow>

          <DataRow label="CREDIT TIER" lit={rowLit(1)} invalid={isInvalid}>
            <div className="flex items-center gap-3">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                {tierShape(MOCK_PROOF.applicant.creditTier, rowLit(1))}
              </svg>
              <span className="mono-data text-sm">
                Tier {MOCK_PROOF.applicant.creditTier}
              </span>
            </div>
          </DataRow>

          <DataRow label="INCOME BAND" lit={rowLit(2)} invalid={isInvalid}>
            <span className="mono-data text-sm">
              Tier 2 ({MOCK_PROOF.applicant.incomeBand})
            </span>
          </DataRow>

          <DataRow label="CONSISTENCY" lit={rowLit(3)} invalid={isInvalid}>
            <span className="mono-data text-sm">
              {MOCK_PROOF.applicant.consistencyMonths}+ months verified
            </span>
          </DataRow>

          <DataRow label="REPUTATION" lit={rowLit(4)} invalid={isInvalid}>
            <span className="mono-data text-sm">
              {MOCK_PROOF.applicant.loansRepaid} loans repaid on time
            </span>
          </DataRow>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-8 space-y-3">
          <Button
            className="w-full h-12 rounded-none bg-secondary text-secondary-foreground font-heading tracking-widest uppercase hover:bg-secondary/90 cursor-crosshair transition-all duration-micro ease-acre"
            disabled={!isValid}
          >
            Issue Credit
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 rounded-none border-primary text-primary font-heading tracking-widest uppercase hover:bg-primary/10 cursor-crosshair transition-all duration-micro ease-acre"
          >
            Request More Proof
          </Button>
          <button className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors duration-micro ease-acre font-heading tracking-widest uppercase py-2 cursor-crosshair">
            Flag Suspicious
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Sub-components --- */

const DataRow = ({ label, children, lit, invalid }: { label: string; children: React.ReactNode; lit: boolean; invalid: boolean }) => (
  <motion.div
    className={`border border-border p-4 acre-card transition-all duration-layout ease-acre ${invalid ? "opacity-30" : ""}`}
    animate={lit ? { borderColor: "hsl(187 94% 43% / 0.4)" } : {}}
    transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
  >
    <span className="text-xs text-muted-foreground tracking-widest block mb-1">{label}</span>
    <div className="flex items-center justify-between">
      {children}
      {lit && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-2 h-2 bg-secondary"
          style={{ boxShadow: "0 0 6px hsl(var(--secondary))" }}
          transition={{ duration: ACRE_MICRO, ease: ACRE_EASE }}
        />
      )}
    </div>
  </motion.div>
);

const CryptoDetails = ({ proof, isInvalid }: { proof: typeof MOCK_PROOF; isInvalid: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-border transition-opacity duration-300 ${isInvalid ? "opacity-30" : ""}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="text-xs font-heading tracking-widest text-muted-foreground uppercase">Cryptographic Details</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-micro ease-acre ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {[
                ["Circuit Version", proof.circuitVersion],
                ["Verification Key", proof.verificationKey],
                ["Attestation Time", new Date(proof.timestamp).toUTCString()],
                ["Block Confirmation", `#${proof.blockNumber.toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <span className="text-xs text-muted-foreground tracking-widest block">{k}</span>
                  <code className="mono-data text-xs text-foreground">{v}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LenderVerification;
