import algosdk from "algosdk";

const ALGOD_SERVER = (import.meta.env.VITE_ALGOD_SERVER as string) || "https://testnet-api.algonode.cloud";
const ALGOD_TOKEN = (import.meta.env.VITE_ALGOD_TOKEN as string) || "";
const MIN_BALANCE_FOR_OPT_IN_MICROALGO = 200_000;

export function getAlgodClient(): algosdk.Algodv2 {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, "");
}

function parseErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err.trim();
  try {
    return JSON.stringify(err);
  } catch {
    return "unknown error";
  }
}

export function getAlgodServerUrl(): string {
  return ALGOD_SERVER;
}

export async function isUserOptedIn(address: string, appId: number): Promise<boolean> {
  if (!address || !algosdk.isValidAddress(address)) {
    return false;
  }
  try {
    const client = getAlgodClient();
    await client.accountApplicationInformation(address, appId).do();
    return true;
  } catch {
    return false;
  }
}

export async function optInToApp(
  address: string,
  appId: number,
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<void> {
  if (!address) {
    throw new Error("Wallet address is missing");
  }
  if (!algosdk.isValidAddress(address)) {
    throw new Error("Wallet address is invalid");
  }
  const client = getAlgodClient();
  const diag: string[] = [
    `wallet=${address}`,
    `appId=${appId}`,
    `algod=${ALGOD_SERVER}`,
  ];
  try {
    const accountInfo = await client.accountInformation(address).do();
    const amount = Number(accountInfo?.amount ?? 0);
    const minBalance = Number(accountInfo?.["min-balance"] ?? accountInfo?.minBalance ?? 0);
    const spendable = amount - minBalance;
    diag.push(`balance=${amount}`, `minBalance=${minBalance}`, `spendable=${spendable}`);
    if (spendable < MIN_BALANCE_FOR_OPT_IN_MICROALGO) {
      throw new Error(
        `Insufficient spendable balance for opt-in (need >= ${MIN_BALANCE_FOR_OPT_IN_MICROALGO} microALGO, got ${spendable})`
      );
    }

    await client.getApplicationByID(appId).do();
    diag.push("appExists=true");
  } catch (err) {
    const details = parseErrorMessage(err);
    throw new Error(`Opt-in precheck failed: ${details} | ${diag.join(" | ")}`);
  }

  try {
    const suggestedParams = await client.getTransactionParams().do();
    const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
      sender: address,
      appIndex: appId,
      suggestedParams,
    });
    const signed = await signTransactions([optInTxn]);
    if (!signed?.[0]) {
      throw new Error("Wallet returned empty signed transaction");
    }
    const sendResult = await client.sendRawTransaction(signed[0]).do();
    diag.push(`txid=${String(sendResult.txid || "")}`);
    await algosdk.waitForConfirmation(client, sendResult.txid, 8);
  } catch (err) {
    const details = parseErrorMessage(err);
    throw new Error(`Opt-in transaction failed: ${details} | ${diag.join(" | ")}`);
  }
}

export function getAlgorandAppId(): number {
  const raw = import.meta.env.VITE_ALGORAND_APP_ID as string | undefined;
  if (!raw) throw new Error("Missing VITE_ALGORAND_APP_ID");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid VITE_ALGORAND_APP_ID");
  return id;
}
