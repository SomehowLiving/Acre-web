import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShieldProof, ProofValid, AlgorandChain } from "@/components/ProofMarks";
import { useToast } from "@/hooks/use-toast";
import { ACRE_EASE, ACRE_MICRO, ACRE_LAYOUT } from "@/components/motion/AcreMotion";
import {
  fetchUserProfile,
  fetchProofHash,
  fetchVerifiedStatus,
  fetchEligibility,
  type UserProfile,
} from "@/lib/api";

type VerificationState = "idle" | "validating" | "valid" | "invalid" | "expired";

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
  const [state, setState] = useState<VerificationState>("idle");
  const [litRows, setLitRows] = useState<number>(0);
  const [searchAddress, setSearchAddress] = useState("");
  const [lookupAddress, setLookupAddress] = useState("");
  const { toast } = useToast();

  // Backend data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [proofHash, setProofHash] = useState("");
  const [eligibility, setEligibility] = useState(0);

  const runVerification = useCallback(async (address: string) => {
    setState("validating");
    setLitRows(0);
    setProfile(null);
    setProofHash("");
    setEligibility(0);

    try {
      const [profileData, hash, verified, elig] = await Promise.all([
        fetchUserProfile(address),
        fetchProofHash(address),
        fetchVerifiedStatus(address),
        fetchEligibility(address),
      ]);

      setProfile(profileData);
      setProofHash(hash);
      setEligibility(elig);

      if (!profileData || !verified) {
        setState("invalid");
      } else {
        setState("valid");
      }
    } catch {
      setState("invalid");
    }
  }, []);

  const handleLookup = () => {
    const addr = searchAddress.trim();
    if (!addr) return;
    setLookupAddress(addr);
    runVerification(addr);
  };

  // Sequential light-up after valid
  useEffect(() => {
    if (state !== "valid") return;
    const total = 5;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setLitRows(i);
      if (i >= total) clearInterval(iv);
    }, 150);
    return () => clearInterval(iv);
  }, [state]);

  const copyHash = () => {
    if (!proofHash) return;
    navigator.clipboard.writeText(proofHash);
    toast({ title: "Hash copied", description: proofHash.slice(0, 24) + "…" });
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

  const tier = profile ? (Number(profile.tier) as 1 | 2 | 3) : 1;
  const creditLimit = profile ? Number(profile.creditLimit) : 0;
  const riderCount = profile ? Number(profile.riderCount) : 0;
  const riderRating = profile ? Number(profile.riderRating) : 0;
  const platform = profile?.platform?.toUpperCase() || "—";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Invalid overlay noise */}
      {isInvalid && (
        <div className="fixed inset-0 z-50 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Address Search Bar */}
      <div className="border-b border-border p-4">
        <div className="container mx-auto flex items-center gap-3">
          <span className="text-xs font-heading tracking-widest text-muted-foreground uppercase">
            Attestation Terminal
          </span>
          <div className="flex-1 flex items-center gap-2 ml-6">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="Enter Algorand wallet address to verify..."
              className="flex-1 bg-muted/30 border border-border px-4 py-2 text-sm mono-data text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors duration-150"
            />
            <button
              onClick={handleLookup}
              disabled={!searchAddress.trim() || isPending}
              className="px-4 py-2 bg-primary text-primary-foreground font-heading text-sm tracking-wider hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={14} />
              VERIFY
            </button>
          </div>
        </div>
      </div>

      {/* Idle State */}
      {state === "idle" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShieldProof size={64} />
            <p className="text-muted-foreground text-sm">
              Enter a wallet address above to verify proof attestation
            </p>
          </div>
        </div>
      )}

      {/* Verification Content */}
      {state !== "idle" && (
        <div className="flex-1 flex">
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
                    {isPending ? "Fetching on-chain attestation data" : isValid ? "All constraints satisfied" : isInvalid ? "No valid attestation found" : "Proof attestation has expired"}
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
                  {proofHash || "—"}
                </code>
                {proofHash && (
                  <>
                    <button onClick={copyHash} className="text-muted-foreground hover:text-secondary acre-link transition-colors duration-micro ease-acre p-1">
                      <Copy size={14} />
                    </button>
                    <a href={`https://testnet.algoexplorer.io/tx/${proofHash}`} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-secondary transition-colors p-1">
                      <ExternalLink size={14} />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Cryptographic Details */}
            <CryptoDetails
              proofHash={proofHash}
              timestamp={profile?.timestamp || ""}
              platform={platform}
              isInvalid={isInvalid}
            />

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
                  {lookupAddress ? `${lookupAddress.slice(0, 8)}…${lookupAddress.slice(-6)}` : "—"}
                </code>
              </DataRow>

              <DataRow label="CREDIT TIER" lit={rowLit(1)} invalid={isInvalid}>
                <div className="flex items-center gap-3">
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    {tierShape(tier, rowLit(1))}
                  </svg>
                  <span className="mono-data text-sm">
                    Tier {tier}
                  </span>
                </div>
              </DataRow>

              <DataRow label="CREDIT LIMIT" lit={rowLit(2)} invalid={isInvalid}>
                <span className="mono-data text-sm">
                  ₹{creditLimit.toLocaleString("en-IN")}
                </span>
              </DataRow>

              <DataRow label="PLATFORM / RIDER COUNT" lit={rowLit(3)} invalid={isInvalid}>
                <span className="mono-data text-sm">
                  {platform} — {riderCount.toLocaleString()} trips
                </span>
              </DataRow>

              <DataRow label="RIDER RATING" lit={rowLit(4)} invalid={isInvalid}>
                <span className="mono-data text-sm">
                  {riderRating ? (riderRating / 100).toFixed(2) : "—"} / 5.00
                </span>
              </DataRow>
            </div>

            {/* Eligibility */}
            {isValid && eligibility > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 border border-secondary/40 bg-secondary/5"
              >
                <span className="text-xs text-muted-foreground tracking-widest block mb-1">ELIGIBILITY</span>
                <span className="font-heading text-lg text-secondary mono-data">₹{eligibility.toLocaleString("en-IN")}</span>
              </motion.div>
            )}

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
      )}
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

const CryptoDetails = ({
  proofHash,
  timestamp,
  platform,
  isInvalid,
}: {
  proofHash: string;
  timestamp: string;
  platform: string;
  isInvalid: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ts = timestamp ? new Date(Number(timestamp) * 1000).toUTCString() : "—";

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
            transition={{ duration: ACRE_LAYOUT, ease: ACRE_EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {[
                ["Proof Hash", proofHash || "—"],
                ["Platform", platform],
                ["Attestation Time", ts],
                ["Network", "Algorand Testnet"],
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