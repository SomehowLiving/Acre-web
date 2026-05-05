import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet, truncateAddress } from "@/contexts/WalletContext";
import {
  createDigiTestRequest,
  fetchDigiHealth,
  fetchDigiTestStatus,
  verifyDigiAlgoPlonk,
  type IdentityVerificationEnvelope,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildDemoAlgoPlonkPayload(walletAddress: string, claimHash: string) {
  const normalizedClaimHash = claimHash.replace(/^0x/, "").toLowerCase();
  const walletCommitment = await sha256Hex(`acre-wallet-v1|${walletAddress}`);
  const proofChunk1 = await sha256Hex(`acre-algoplonk-proof-1|${normalizedClaimHash}`);
  const proofChunk2 = await sha256Hex(`acre-algoplonk-proof-2|${walletAddress}`);
  return {
    algoplonkPublicInputsHex: `0x${normalizedClaimHash}${walletCommitment}`,
    algoplonkProofHex: `0x${proofChunk1}${proofChunk2}`,
  };
}

const DigiTest = () => {
  const { account, connectWallet, getActiveAccount, connecting } = useWallet();
  const [health, setHealth] = useState<null | {
    success: boolean;
    digilockerConfigured: boolean;
    algoplonk: {
      verifyAppId: number | null;
      requireOnchainVerify: boolean;
      simulateOnly: boolean;
    };
  }>(null);
  const [identityState, setIdentityState] = useState<IdentityVerificationEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    fetchDigiHealth().then(setHealth).catch(() => {});
  }, []);

  const appendLog = (message: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${message}`, ...prev].slice(0, 12));
  };

  const ensureWallet = async () => {
    const existing = await getActiveAccount();
    if (existing) return existing;
    const connected = await connectWallet();
    return connected;
  };

  const handleCreateRequest = async () => {
    setBusy(true);
    try {
      const wallet = await ensureWallet();
      if (!wallet) throw new Error("No wallet connected");
      const session = await createDigiTestRequest(wallet);
      setIdentityState(session);
      appendLog(`Created DigiLocker request ${session.requestId}`);
      toast({ title: "Digi Request Created", description: session.requestId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create Digi request";
      appendLog(`Create request failed: ${message}`);
      toast({ title: "Digi Request Failed", description: message });
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!identityState?.requestId) return;
    setBusy(true);
    try {
      const session = await fetchDigiTestStatus(identityState.requestId);
      setIdentityState(session);
      appendLog(`Fetched status: ${session.status}`);
      toast({ title: "Status Updated", description: session.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh Digi status";
      appendLog(`Status refresh failed: ${message}`);
      toast({ title: "Status Failed", description: message });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyAlgoPlonk = async () => {
    if (!identityState?.requestId || !identityState.claimHashes) return;
    setBusy(true);
    try {
      const wallet = await ensureWallet();
      if (!wallet) throw new Error("No wallet connected");
      const claimHash =
        identityState.claimHashes.indianCitizen ||
        identityState.claimHashes.ageOver18 ||
        identityState.claimHashes.verifiedHuman;
      if (!claimHash) throw new Error("Missing claim hash");
      const payload = await buildDemoAlgoPlonkPayload(wallet, claimHash);
      const verified = await verifyDigiAlgoPlonk({
        walletAddress: wallet,
        requestId: identityState.requestId,
        claimType: "indianCitizen",
        ...payload,
      });
      setIdentityState(verified);
      appendLog(`AlgoPlonk verified in mode: ${verified.algoplonk?.verificationMode || "unknown"}`);
      toast({ title: "AlgoPlonk Verified", description: verified.algoplonk?.verificationMode || "verified" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify AlgoPlonk";
      appendLog(`AlgoPlonk failed: ${message}`);
      toast({ title: "AlgoPlonk Failed", description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl tracking-wide text-foreground">DIGI TEST</h1>
            <p className="text-sm text-muted-foreground">Isolated DigiLocker + AlgoPlonk test harness</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/generate" className="text-sm text-primary hover:underline">
              Back to Generate
            </Link>
            <button
              onClick={connectWallet}
              disabled={connecting || busy}
              className="px-4 py-2 border border-primary/40 text-sm font-heading text-primary"
            >
              {account ? truncateAddress(account) : connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 border border-border bg-card space-y-4">
            <div className="font-heading text-sm tracking-wide text-foreground">SETUP</div>
            <div className="text-sm text-muted-foreground">
              Wallet: <span className="font-mono text-foreground">{account || "not connected"}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              DigiLocker configured: <span className="text-foreground">{health ? String(health.digilockerConfigured) : "loading..."}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              AlgoPlonk verifier app: <span className="text-foreground">{health?.algoplonk.verifyAppId ?? "none"}</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleCreateRequest}
                disabled={busy}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-heading disabled:opacity-50"
              >
                Create Digi Request
              </button>
              <button
                onClick={handleRefreshStatus}
                disabled={busy || !identityState?.requestId}
                className="px-4 py-2 border border-border text-sm font-heading disabled:opacity-50"
              >
                Refresh Status
              </button>
              <button
                onClick={handleVerifyAlgoPlonk}
                disabled={busy || identityState?.status !== "identity_verified"}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-heading disabled:opacity-50"
              >
                Verify AlgoPlonk
              </button>
            </div>
          </div>

          <div className="p-6 border border-border bg-card space-y-4">
            <div className="font-heading text-sm tracking-wide text-foreground">EVENT LOG</div>
            <div className="space-y-2 text-xs font-mono">
              {log.length ? log.map((entry) => (
                <div key={entry} className="p-2 bg-muted/20 break-all">{entry}</div>
              )) : <div className="text-muted-foreground">No events yet.</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 border border-border bg-card space-y-4">
            <div className="font-heading text-sm tracking-wide text-foreground">IDENTITY STATE</div>
            <pre className="text-xs bg-muted/20 p-4 overflow-auto whitespace-pre-wrap break-all">
              {JSON.stringify(identityState, null, 2)}
            </pre>
          </div>

          <div className="p-6 border border-border bg-card space-y-4">
            <div className="font-heading text-sm tracking-wide text-foreground">TEST FLOW</div>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
              <li>Connect wallet.</li>
              <li>Create Digi request.</li>
              <li>Open the returned `authUrl` if live DigiLocker is configured.</li>
              <li>Refresh status until it becomes `identity_verified`.</li>
              <li>Click `Verify AlgoPlonk` to test the isolated proof-validation path.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigiTest;
