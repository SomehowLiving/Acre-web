import React from "react";
import { motion } from "framer-motion";
import type { IdentityVerificationEnvelope } from "@/lib/api";

interface DigiLockerConnectionProps {
  walletAddress: string | null;
  identityState: IdentityVerificationEnvelope | null;
  busy: boolean;
  onStart: () => void;
  onRefresh: () => void;
  onContinue: () => void;
}

export const DigiLockerConnection: React.FC<DigiLockerConnectionProps> = ({
  walletAddress,
  identityState,
  busy,
  onStart,
  onRefresh,
  onContinue,
}) => {
  const status = identityState?.status || "idle";
  const verified = status === "identity_verified";
  const pending = status === "pending_digilocker_consent";
  const isMockMode = pending && !!identityState?.authUrl?.includes('mock-digilocker-consent');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl tracking-wide text-foreground mb-2">
          IDENTITY VERIFICATION
        </h1>
        <p className="text-muted-foreground text-sm">
          Link your Algorand wallet to DigiLocker first. Acre uses DigiLocker as the identity source
          of truth and AlgoPlonk as the privacy-preserving claim validation layer.
        </p>
      </div>

      <div className="p-6 border border-border bg-card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">CONNECTED WALLET</div>
            <div className="font-mono text-sm break-all">{walletAddress || "Not connected"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">STATUS</div>
            <div className="font-heading text-sm uppercase tracking-wide text-primary">
              {status.replaceAll("_", " ")}
            </div>
          </div>
        </div>

        {/* DigiLocker consent link — real Setu URL in prod, local mock page in sandbox */}
        {identityState?.authUrl && !verified && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <a
              href={identityState.authUrl}
              target="_blank"
              rel="noreferrer"
              className="block p-4 border border-primary/40 bg-primary/5 text-sm text-primary hover:bg-primary/10 transition-colors"
            >
              {isMockMode ? "Open mock Aadhaar consent screen →" : "Open DigiLocker consent window →"}
            </a>

            {/* Mock mode info panel */}
            {isMockMode && (
              <div className="p-4 border border-yellow-500/40 bg-yellow-500/5 text-sm space-y-2">
                <div className="font-heading text-xs tracking-wide text-yellow-500">MOCK MODE — SANDBOX ONLY</div>
                <p className="text-muted-foreground text-xs">
                  No real Setu credentials. Click the link above to open the local Aadhaar consent simulator,
                  approve access, then click Check Status to extract mock claims.
                </p>
                <div className="font-mono text-xs text-muted-foreground space-y-0.5 pt-1">
                  <div>request_id: {identityState?.requestId}</div>
                  <div>aadhaar: XXXX-XXXX-4242 · DOB: 01-01-1998 · country: India</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {identityState?.flags && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground mb-1">VERIFIED HUMAN</div>
              <div className="font-heading text-sm">{identityState.flags.isVerifiedHuman ? "TRUE" : "FALSE"}</div>
            </div>
            <div className="p-3 border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground mb-1">INDIAN CITIZEN</div>
              <div className="font-heading text-sm">{identityState.flags.isIndian ? "TRUE" : "FALSE"}</div>
            </div>
            <div className="p-3 border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground mb-1">AGE OVER 18</div>
              <div className="font-heading text-sm">{identityState.flags.ageOver18 ? "TRUE" : "FALSE"}</div>
            </div>
          </div>
        )}

        {identityState?.algoplonk && (
          <div className="p-4 border border-secondary/40 bg-secondary/5 text-sm space-y-2">
            <div className="font-heading tracking-wide text-secondary">ALGOPLONK STATUS</div>
            <div>Verification mode: {identityState.algoplonk.verificationMode}</div>
            <div>Proof verified: {identityState.algoplonk.proofVerified ? "true" : "false"}</div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!identityState && (
            <button
              onClick={onStart}
              disabled={busy}
              className="px-4 py-2 bg-primary text-primary-foreground font-heading text-sm disabled:opacity-50"
            >
              {busy ? "Starting..." : "Start DigiLocker"}
            </button>
          )}

          {identityState && !verified && (
            <button
              onClick={onRefresh}
              disabled={busy}
              className="px-4 py-2 bg-primary text-primary-foreground font-heading text-sm disabled:opacity-50"
            >
              {busy ? "Verifying..." : isMockMode ? "Simulate Approval" : "Check Status"}
            </button>
          )}

          {verified && (
            <button
              onClick={onContinue}
              className="px-4 py-2 bg-secondary text-secondary-foreground font-heading text-sm"
            >
              Continue To Income Proof
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
