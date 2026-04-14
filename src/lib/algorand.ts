import algosdk from "algosdk";

const ALGOD_SERVER = (import.meta.env.VITE_ALGOD_SERVER as string) || "https://testnet-api.algonode.cloud";
const ALGOD_TOKEN = (import.meta.env.VITE_ALGOD_TOKEN as string) || "";

export function getAlgodClient(): algosdk.Algodv2 {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, "");
}

export async function isUserOptedIn(address: string, appId: number): Promise<boolean> {
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
  const client = getAlgodClient();
  const suggestedParams = await client.getTransactionParams().do();
  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: address,
    appIndex: appId,
    suggestedParams,
  });
  const signed = await signTransactions([optInTxn]);
  const sendResult = await client.sendRawTransaction(signed[0]).do();
  await algosdk.waitForConfirmation(client, sendResult.txid, 4);
}

export function getAlgorandAppId(): number {
  const raw = import.meta.env.VITE_ALGORAND_APP_ID as string | undefined;
  if (!raw) throw new Error("Missing VITE_ALGORAND_APP_ID");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid VITE_ALGORAND_APP_ID");
  return id;
}
