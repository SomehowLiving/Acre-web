import type { ProofPayload } from "./reclaim";

export interface VerifyResponse {
  success: boolean;
  tier: number;
  creditLimit: number;
  txId: string;
  message?: string;
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

const BACKEND_VERIFY_URL =
  (import.meta.env.VITE_BACKEND_VERIFY_URL as string) || "https://lushier-rosalia-superearthly.ngrok-free.dev/verify-proof";

function getBaseUrl(): string {
  return BACKEND_VERIFY_URL.replace(/\/verify-proof\/?$/, "");
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
