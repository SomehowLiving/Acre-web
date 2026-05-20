import type { ProofPayload } from "./reclaim";

export interface VerifyResponse {
  success: boolean;
  tier: number;
  creditLimit: number;
  txId: string;
  message?: string;
  identity?: IdentityVerificationEnvelope;
}

export interface IdentityFlags {
  isIndian: boolean;
  ageOver18: boolean;
  isVerifiedHuman: boolean;
}

export interface AlgoPlonkStatus {
  proofVerified: boolean;
  verificationMode: "shape_verified" | "onchain_verified";
  proofHash: string;
  publicInputsHash: string;
  onchainVerification?: {
    verified: boolean;
    txId: string | null;
  } | null;
  onchainError?: string | null;
  proofChunkCount?: number;
  publicInputChunkCount?: number;
}

export interface IdentityVerificationEnvelope {
  requestId: string;
  walletAddress?: string;
  status: string;
  authUrl?: string;
  flags: IdentityFlags | null;
  claimHashes: Record<string, string> | null;
  algoplonk?: AlgoPlonkStatus | null;
}

export interface VerifyWorkerProfilePayload {
  walletAddress: string;
  identityRequestId: string;
  reclaimProof: ProofPayload;
  algoplonkProofHex: string;
  algoplonkPublicInputsHex: string;
  claimType?: string;
}

export interface UserProfile {
  verified: boolean;
  tier: string;
  creditLimit: string;
  timestamp: string;
  riderCount: string;
  riderRating: string;
  platform: string;
}

export interface BlueScoreBreakdownFactor {
  bucket: string;
  points: number;
}

export interface BlueScoreResponse {
  success: boolean;
  address: string;
  verifiedKyc: boolean;
  score: number;
  tier: "Blue Prime" | "Blue Plus" | "Blue Basic";
  loanEligibility: number;
  breakdown: {
    income: BlueScoreBreakdownFactor;
    consistency: BlueScoreBreakdownFactor;
    rating: BlueScoreBreakdownFactor;
    activity: BlueScoreBreakdownFactor;
  };
  features: {
    monthlyIncome: number;
    consistencyMonths: number;
    rating: number;
    activityLevel: "low" | "medium" | "high";
  };
  scoreFreshnessDays: number;
  proofExpiresInDays: number;
  message: string;
}

export interface BlueScoreSimulationResponse {
  success: boolean;
  simulationOnly: boolean;
  score: number;
  tier: "Blue Prime" | "Blue Plus" | "Blue Basic";
  loanEligibility: number;
  breakdown: BlueScoreResponse["breakdown"];
  coachingMessage: string;
  disclaimer: string;
}

export interface PassportResponse {
  success: boolean;
  address: string;
  passport: {
    identity: {
      kycVerified: boolean;
      sameIdentityAcrossSessions: boolean;
      piiExposed: boolean;
      identityBonded: boolean;
    };
    blueScore: {
      score: number;
      tier: "Blue Prime" | "Blue Plus" | "Blue Basic";
      breakdown: BlueScoreResponse["breakdown"];
    };
    trust: {
      fraudRisk: string;
      scoreVerifiedDaysAgo: number;
      reputationUpdateCadence: string;
      incomeProofExpiryDays: number;
    };
  };
  pipeline: string[];
}

export interface GrowthResponse {
  success: boolean;
  address: string;
  skills: string[];
  recommendations: string[];
  quests: Array<{
    id: string;
    title: string;
    progressMonths: number;
    targetMonths: number;
    reward: string;
  }>;
}

const BACKEND_VERIFY_URL =
  (import.meta.env.VITE_BACKEND_VERIFY_URL as string) || "https://lushier-rosalia-superearthly.ngrok-free.dev/verify-proof";

function getBaseUrl(): string {
  return BACKEND_VERIFY_URL.replace(/\/(verify-proof|verify-worker-profile)\/?$/, "");
}

export async function verifyProofWithBackend(
  proof: ProofPayload,
  walletAddress: string
): Promise<VerifyResponse> {
  const response = await fetch(BACKEND_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proof, walletAddress }),
  });
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Verification failed");
  return body as VerifyResponse;
}

export async function createDigiLockerRequest(
  walletAddress: string,
  redirectUrl?: string
): Promise<IdentityVerificationEnvelope> {
  const response = await fetch(`${getBaseUrl()}/api/identity/digilocker/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, redirectUrl }),
  });
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Failed to create DigiLocker request");
  return body as IdentityVerificationEnvelope;
}

export async function pollDigiLockerStatus(requestId: string): Promise<IdentityVerificationEnvelope> {
  const response = await fetch(`${getBaseUrl()}/api/identity/digilocker/${requestId}/status`);
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Failed to poll DigiLocker status");
  return body as IdentityVerificationEnvelope;
}

export async function verifyWorkerProfile(
  payload: VerifyWorkerProfilePayload
): Promise<VerifyResponse> {
  const response = await fetch(`${getBaseUrl()}/verify-worker-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Worker profile verification failed");
  return body as VerifyResponse;
}

export async function fetchDigiHealth(): Promise<{
  success: boolean;
  digilockerConfigured: boolean;
  algoplonk: {
    verifyAppId: number | null;
    requireOnchainVerify: boolean;
    simulateOnly: boolean;
  };
}> {
  const response = await fetch(`${getBaseUrl()}/api/digi/health`);
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Failed to fetch Digi health");
  return body;
}

export async function createDigiTestRequest(
  walletAddress: string,
  redirectUrl?: string
): Promise<IdentityVerificationEnvelope> {
  const response = await fetch(`${getBaseUrl()}/api/digi/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, redirectUrl }),
  });
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Failed to create Digi test request");
  return body as IdentityVerificationEnvelope;
}

export async function fetchDigiTestStatus(requestId: string): Promise<IdentityVerificationEnvelope> {
  const response = await fetch(`${getBaseUrl()}/api/digi/${requestId}/status`);
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Failed to fetch Digi test status");
  return body as IdentityVerificationEnvelope;
}

export async function verifyDigiAlgoPlonk(payload: {
  walletAddress: string;
  requestId: string;
  algoplonkProofHex: string;
  algoplonkPublicInputsHex: string;
  claimType?: string;
}): Promise<IdentityVerificationEnvelope> {
  const response = await fetch(`${getBaseUrl()}/api/digi/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!response.ok || !body.success) throw new Error(body.message || "Failed to verify Digi AlgoPlonk payload");
  return body as IdentityVerificationEnvelope;
}

export async function fetchUserProfile(address: string): Promise<UserProfile | null> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/user/${address}/full-profile`);
    const body = await res.json();
    return body.profile || null;
  } catch {
    return null;
  }
}

export async function fetchProofCount(): Promise<number> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/proof-count`);
    const body = await res.json();
    return Number(body.proofCount || 0);
  } catch {
    return 0;
  }
}

export async function fetchAdminAddress(): Promise<string> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/admin`);
    const body = await res.json();
    return body.admin || "";
  } catch {
    return "";
  }
}

export async function fetchVerifierAddress(): Promise<string> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/verifier`);
    const body = await res.json();
    return body.verifier || "";
  } catch {
    return "";
  }
}

export async function fetchProofHash(address: string): Promise<string> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/user/${address}/proof-hash`);
    const body = await res.json();
    return body.proofHash || "";
  } catch {
    return "";
  }
}

export async function fetchVerifiedStatus(address: string): Promise<boolean> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/user/${address}/verified`);
    const body = await res.json();
    return Boolean(body.verified);
  } catch {
    return false;
  }
}

export async function fetchCreditLimit(address: string): Promise<number> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/user/${address}/credit-limit`);
    const body = await res.json();
    return Number(body.creditLimit || 0);
  } catch {
    return 0;
  }
}

export async function fetchEligibility(address: string): Promise<number> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/user/${address}/eligibility`);
    const body = await res.json();
    return Number(body.eligibility || 0);
  } catch {
    return 0;
  }
}

export async function fetchBlueScore(address: string): Promise<BlueScoreResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/blue-score/${address}`);
  const body = await res.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!res.ok || !body.success) throw new Error(body.message || "Failed to fetch blue score");
  return body as BlueScoreResponse;
}

export async function simulateBlueScore(payload: {
  monthlyIncome: number;
  consistencyMonths: number;
  rating: number;
  activityLevel: "low" | "medium" | "high";
}): Promise<BlueScoreSimulationResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/blue-score/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!res.ok || !body.success) throw new Error(body.message || "Failed to simulate blue score");
  return body as BlueScoreSimulationResponse;
}

export async function fetchPassport(address: string): Promise<PassportResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/passport/${address}`);
  const body = await res.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!res.ok || !body.success) throw new Error(body.message || "Failed to fetch passport");
  return body as PassportResponse;
}

export async function fetchGrowth(address: string): Promise<GrowthResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/growth/${address}`);
  const body = await res.json().catch(() => ({ message: "Invalid JSON response from backend" }));
  if (!res.ok || !body.success) throw new Error(body.message || "Failed to fetch growth recommendations");
  return body as GrowthResponse;
}
