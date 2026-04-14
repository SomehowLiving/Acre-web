import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SourceConnection } from "@/components/proof-generation/SourceConnection";
import { CircuitConfiguration } from "@/components/proof-generation/CircuitConfiguration";
import { ProofGeneration } from "@/components/proof-generation/ProofGeneration";
import { ProofPreview } from "@/components/proof-generation/ProofPreview";
import { useWallet, truncateAddress } from "@/contexts/WalletContext";
import { isUserOptedIn, optInToApp, getAlgorandAppId } from "@/lib/algorand";
import { generateReclaimProof, type ProofPayload } from "@/lib/reclaim";
import { verifyProofWithBackend, type VerifyResponse } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export type ProofStep = 1 | 2 | 3 | 4;

export interface CircuitParams {
  incomeThreshold: number;
  consistencyPeriod: number;
  privacyLevel: "standard" | "maximum";
}

export interface ProofData {
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
}

const GenerateProof: React.FC = () => {
  const { account, connectWallet, signTransactions } = useWallet();
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

  const handleSourceConnect = async (sourceId: string) => {
    if (!account) {
      toast({ title: "Wallet Required", description: "Please connect your wallet first" });
      try { await connectWallet(); } catch { return; }
    }

    // Opt-in check
    try {
      const appId = getAlgorandAppId();
      const optedIn = await isUserOptedIn(account!, appId);
      if (!optedIn) {
        toast({ title: "Opt-In Required", description: "Signing opt-in transaction..." });
        await optInToApp(account!, appId, signTransactions);
        toast({ title: "Opted In", description: "Successfully opted into Acre contract" });
      }
    } catch (err) {
      toast({ title: "Opt-In Failed", description: err instanceof Error ? err.message : "Failed to opt in" });
      return;
    }

    // Generate Reclaim proof for this source
    try {
      const proof = await generateReclaimProof(account!, (url) => setQrUrl(url));
      setReclaimProof(proof);
      setQrUrl("");
      if (!connectedSources.includes(sourceId)) {
        setConnectedSources((prev) => [...prev, sourceId]);
      }
    } catch (err) {
      setQrUrl("");
      toast({ title: "Proof Failed", description: err instanceof Error ? err.message : "Failed to generate proof" });
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
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
    setCurrentStep(3);
  };

  const handleProofComplete = async (animatedData: ProofData) => {
    // Call real backend verification
    if (reclaimProof && account) {
      try {
        const result: VerifyResponse = await verifyProofWithBackend(reclaimProof, account);
        const realProofData: ProofData = {
          ...animatedData,
          proofHash: result.txId ? `0x${result.txId}` : animatedData.proofHash,
          tier: result.tier,
          creditLimit: result.creditLimit,
          txId: result.txId,
          publicSignals: {
            ...animatedData.publicSignals,
            income_band: `Tier ${result.tier}`,
          },
        };
        setProofData(realProofData);
      } catch (err) {
        toast({
          title: "Verification Failed",
          description: err instanceof Error ? err.message : "Backend verification failed",
        });
        setProofData(animatedData);
      }
    } else {
      setProofData(animatedData);
    }
    setIsGenerating(false);
    setCurrentStep(4);
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
                {[1, 2, 3, 4].map((step) => (
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
              <SourceConnection
                connectedSources={connectedSources}
                onSourceConnect={handleSourceConnect}
                onNext={handleNextStep}
                qrUrl={qrUrl}
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
              <CircuitConfiguration
                params={circuitParams}
                onParamsChange={setCircuitParams}
                onBack={handlePrevStep}
                onGenerate={handleStartGeneration}
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
              <ProofGeneration
                params={circuitParams}
                onComplete={handleProofComplete}
              />
            </motion.div>
          )}

          {currentStep === 4 && proofData && (
            <motion.div
              key="step4"
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
