import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DigiLockerConnection } from "@/components/identity/DigiLockerConnection";
import { SourceConnection } from "@/components/proof-generation/SourceConnection";
import { CircuitConfiguration } from "@/components/proof-generation/CircuitConfiguration";
import { ProofGeneration } from "@/components/proof-generation/ProofGeneration";
import { ProofPreview } from "@/components/proof-generation/ProofPreview";
import { useWallet, truncateAddress } from "@/contexts/WalletContext";
import { isUserOptedIn, optInToApp, getAlgorandAppId, getAlgodServerUrl } from "@/lib/algorand";
import { generateReclaimProof, type ProofPayload } from "@/lib/reclaim";
import {
  createDigiLockerRequest,
  pollDigiLockerStatus,
  verifyWorkerProfile,
  type IdentityVerificationEnvelope,
  type VerifyResponse,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export type ProofStep = 1 | 2 | 3 | 4 | 5;

export interface CircuitParams {
  incomeThreshold: number;
  consistencyPeriod: number;
  privacyLevel: "standard" | "maximum";
}

export interface ProofData {
  walletAddress?: string;
  proofHash: string;
  publicSignals: {
    income_band: string;
    consistency_months: number;
    timestamp: number;
  };
  privateInputs: string[];
  circuit: string;
  constraintsSatisfied: number;
  totalConstraints: number;
  // Real backend data
  tier?: number;
  creditLimit?: number;
  txId?: string;
  identity?: {
    requestId: string;
    status: string;
    flags: {
      isIndian: boolean;
      ageOver18: boolean;
      isVerifiedHuman: boolean;
    } | null;
    algoplonkMode?: string;
  };
}

function sha256Hex(input: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)).then((buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

async function buildAlgoPlonkPayload(
  walletAddress: string,
  identityState: IdentityVerificationEnvelope
): Promise<{ proofHex: string; publicInputsHex: string }> {
  const claimHash =
    identityState.claimHashes?.indianCitizen ||
    identityState.claimHashes?.ageOver18 ||
    identityState.claimHashes?.verifiedHuman;

  if (!claimHash) {
    throw new Error("Missing claim hash from DigiLocker verification");
  }

  const normalizedClaimHash = claimHash.replace(/^0x/, "").toLowerCase();
  const walletCommitment = await sha256Hex(`acre-wallet-v1|${walletAddress}`);
  const proofChunk1 = await sha256Hex(`acre-algoplonk-proof-1|${normalizedClaimHash}`);
  const proofChunk2 = await sha256Hex(`acre-algoplonk-proof-2|${walletAddress}`);

  return {
    publicInputsHex: `0x${normalizedClaimHash}${walletCommitment}`,
    proofHex: `0x${proofChunk1}${proofChunk2}`,
  };
}

const GenerateProof: React.FC = () => {
  const { account, connectWallet, getActiveAccount, signTransactions } = useWallet();
  const [currentStep, setCurrentStep] = useState<ProofStep>(1);
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [circuitParams, setCircuitParams] = useState<CircuitParams>({
    incomeThreshold: 50000,
    consistencyPeriod: 6,
    privacyLevel: "standard",
  });
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reclaimProof, setReclaimProof] = useState<ProofPayload | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [identityState, setIdentityState] = useState<IdentityVerificationEnvelope | null>(null);
  const [identityBusy, setIdentityBusy] = useState(false);

  const ensureWallet = async (): Promise<string | null> => {
    let activeWallet = await getActiveAccount();
    if (!activeWallet) {
      toast({ title: "Wallet Required", description: "Please connect your wallet first" });
      try {
        activeWallet = await connectWallet();
      } catch {
        return null;
      }
    }

    if (!activeWallet) {
      toast({ title: "Wallet Missing", description: "No valid wallet address was returned by Pera" });
      return null;
    }

    return activeWallet;
  };

  const ensureWalletAndOptIn = async (): Promise<string | null> => {
    const activeWallet = await ensureWallet();
    if (!activeWallet) {
      return null;
    }

    try {
      const appId = getAlgorandAppId();
      const optedIn = await isUserOptedIn(activeWallet, appId);
      if (!optedIn) {
        toast({ title: "Opt-In Required", description: "Signing opt-in transaction..." });
        await optInToApp(activeWallet, appId, signTransactions);
        toast({ title: "Opted In", description: "Successfully opted into Acre contract" });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Failed to opt in";
      toast({
        title: "Opt-In Failed",
        description: `${reason}. Check VITE_ALGORAND_APP_ID, wallet TestNet account balance, and algod endpoint ${getAlgodServerUrl()}`,
      });
      return null;
    }

    return activeWallet;
  };

  const handleStartIdentity = async () => {
    if (identityState?.status === "identity_verified") {
      toast({
        title: "Already Verified",
        description: "Identity is already linked to this wallet.",
      });
      return;
    }

    const activeWallet = await ensureWalletAndOptIn();
    if (!activeWallet) return;

    setIdentityBusy(true);
    try {
      const session = await createDigiLockerRequest(activeWallet);
      setIdentityState(session);
      // Only open consent window when consent is still pending.
      if (session.authUrl && session.status !== "identity_verified") {
        const popup = window.open(session.authUrl, "_blank", "noopener,noreferrer");
        if (!popup) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups and open the DigiLocker consent window.",
          });
        }
      }
      toast({
        title: "DigiLocker Started",
        description: session.authUrl ? "Open the consent window and complete verification" : "Identity session created",
      });
    } catch (err) {
      toast({
        title: "Identity Setup Failed",
        description: err instanceof Error ? err.message : "Failed to create DigiLocker request",
      });
    } finally {
      setIdentityBusy(false);
    }
  };

  const handleRefreshIdentity = async () => {
    if (!identityState?.requestId) return;
    setIdentityBusy(true);
    try {
      const session = await pollDigiLockerStatus(identityState.requestId);
      setIdentityState(session);
      if (session.status === "identity_verified") {
        toast({ title: "Identity Verified", description: "DigiLocker claims are ready for Acre scoring" });
      }
    } catch (err) {
      toast({
        title: "Status Check Failed",
        description: err instanceof Error ? err.message : "Failed to check DigiLocker status",
      });
    } finally {
      setIdentityBusy(false);
    }
  };

  const handleSourceConnect = async (sourceId: string) => {
    if (identityState?.status !== "identity_verified") {
      toast({
        title: "Identity Required",
        description: "Complete DigiLocker verification before connecting income sources",
      });
      return;
    }

    const activeWallet = await ensureWalletAndOptIn();
    if (!activeWallet) return;

    // Generate Reclaim proof for this source
    try {
      const proof = await generateReclaimProof(activeWallet, (url) => setQrUrl(url));
      setReclaimProof(proof);
      setQrUrl("");
      if (!connectedSources.includes(sourceId)) {
        setConnectedSources((prev) => [...prev, sourceId]);
      }
      setCurrentStep(3);
    } catch (err) {
      setQrUrl("");
      toast({ title: "Proof Failed", description: err instanceof Error ? err.message : "Failed to generate proof" });
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as ProofStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as ProofStep);
    }
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setCurrentStep(4);
  };

  const handleProofComplete = async (animatedData: ProofData) => {
    // Call real backend verification
    if (reclaimProof && account && identityState?.requestId && identityState.status === "identity_verified") {
      try {
        const { proofHex, publicInputsHex } = await buildAlgoPlonkPayload(account, identityState);
        const result: VerifyResponse = await verifyWorkerProfile({
          walletAddress: account,
          identityRequestId: identityState.requestId,
          reclaimProof,
          algoplonkProofHex: proofHex,
          algoplonkPublicInputsHex: publicInputsHex,
          claimType: "indianCitizen",
        });
        const realProofData: ProofData = {
          ...animatedData,
          walletAddress: account,
          proofHash: result.txId ? `0x${result.txId}` : animatedData.proofHash,
          tier: result.tier,
          creditLimit: result.creditLimit,
          txId: result.txId,
          publicSignals: {
            ...animatedData.publicSignals,
            income_band: `Tier ${result.tier}`,
          },
          identity: result.identity
            ? {
                requestId: result.identity.requestId,
                status: result.identity.status,
                flags: result.identity.flags,
                algoplonkMode: result.identity.algoplonk?.verificationMode,
              }
            : {
                requestId: identityState.requestId,
                status: identityState.status,
                flags: identityState.flags,
              },
        };
        setProofData(realProofData);
      } catch (err) {
        toast({
          title: "Verification Failed",
          description: err instanceof Error ? err.message : "Backend verification failed",
        });
        setProofData({ ...animatedData, walletAddress: account });
      }
    } else {
      setProofData({ ...animatedData, walletAddress: account || undefined });
    }
    setIsGenerating(false);
    setCurrentStep(5);
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const goToStep = (step: ProofStep) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="font-heading text-lg tracking-wide text-foreground hover:text-primary transition-colors">
                ACRE
              </a>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground text-sm">Generate Proof</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Wallet status */}
              {account && (
                <span className="text-xs mono-data text-muted-foreground">
                  {truncateAddress(account)}
                </span>
              )}
              {/* Step Indicators */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <button
                    key={step}
                    onClick={() => step < currentStep && goToStep(step as ProofStep)}
                    disabled={step > currentStep}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-heading transition-all ${
                      step === currentStep
                        ? "bg-primary text-primary-foreground"
                        : step < currentStep
                        ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                        : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <DigiLockerConnection
                walletAddress={account}
                identityState={identityState}
                busy={identityBusy}
                onStart={handleStartIdentity}
                onRefresh={handleRefreshIdentity}
                onContinue={() => {
                  setDirection(1);
                  setCurrentStep(2);
                }}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SourceConnection
                connectedSources={connectedSources}
                onSourceConnect={handleSourceConnect}
                onNext={handleNextStep}
                qrUrl={qrUrl}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <CircuitConfiguration
                params={circuitParams}
                onParamsChange={setCircuitParams}
                onBack={handlePrevStep}
                onGenerate={handleStartGeneration}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ProofGeneration
                params={circuitParams}
                onComplete={handleProofComplete}
              />
            </motion.div>
          )}

          {currentStep === 5 && proofData && (
            <motion.div
              key="step5"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ProofPreview
                proofData={proofData}
                onBack={() => goToStep(2)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GenerateProof;
