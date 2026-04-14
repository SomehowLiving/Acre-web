export type ProofPayload = unknown;

export async function generateReclaimProof(
  walletAddress: string,
  onRequestUrl: (url: string) => void
): Promise<ProofPayload> {
  const appId = import.meta.env.VITE_RECLAIM_APP_ID as string;
  const appSecret = import.meta.env.VITE_RECLAIM_APP_SECRET as string;
  const providerId = import.meta.env.VITE_RECLAIM_PROVIDER_ID as string;

  if (!appId || !appSecret || !providerId) {
    throw new Error("Missing Reclaim environment configuration (VITE_RECLAIM_APP_ID, VITE_RECLAIM_APP_SECRET, VITE_RECLAIM_PROVIDER_ID)");
  }

  const { ReclaimProofRequest } = await import("@reclaimprotocol/js-sdk");
  const reclaim = await ReclaimProofRequest.init(appId, appSecret, providerId);
  reclaim.setContext(walletAddress, "acre-verification");
  const requestUrl = await reclaim.getRequestUrl();
  onRequestUrl(requestUrl);

  return new Promise((resolve, reject) => {
    reclaim
      .startSession({
        onSuccess: (proofPayload: unknown) =>
          resolve(Array.isArray(proofPayload) ? proofPayload[0] : proofPayload),
        onError: (err: unknown) =>
          reject(err instanceof Error ? err : new Error("Proof session failed")),
      })
      .catch((err: unknown) =>
        reject(err instanceof Error ? err : new Error("Failed to start proof session"))
      );
  });
}
