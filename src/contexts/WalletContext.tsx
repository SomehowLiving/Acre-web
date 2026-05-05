import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";

interface WalletContextValue {
  account: string | null;
  connecting: boolean;
  connectWallet: () => Promise<string>;
  getActiveAccount: () => Promise<string | null>;
  disconnectWallet: () => Promise<void>;
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
  peraWallet: PeraWalletConnect;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const peraWallet = new PeraWalletConnect();

function normalizeWalletAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate) return null;
  return algosdk.isValidAddress(candidate) ? candidate : null;
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        const active = normalizeWalletAddress(accounts?.[0]);
        if (mounted) setAccount(active);
      } catch {
        if (mounted) setAccount(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      const accounts = await peraWallet.connect();
      const active = normalizeWalletAddress(accounts?.[0]);
      if (!active) throw new Error("No valid wallet account returned");
      setAccount(active);
      return active;
    } finally {
      setConnecting(false);
    }
  }, []);

  const getActiveAccount = useCallback(async () => {
    if (account && normalizeWalletAddress(account)) {
      return account;
    }
    try {
      const accounts = await peraWallet.reconnectSession();
      const active = normalizeWalletAddress(accounts?.[0]);
      setAccount(active);
      return active;
    } catch {
      setAccount(null);
      return null;
    }
  }, [account]);

  const disconnectWallet = useCallback(async () => {
    await peraWallet.disconnect();
    setAccount(null);
  }, []);

  const signTransactions = useCallback(async (txns: algosdk.Transaction[]) => {
    const active = await getActiveAccount();
    if (!active) {
      throw new Error("No active wallet session available for signing");
    }
    const txGroup = txns.map((txn) => ({ txn }));
    return peraWallet.signTransaction([txGroup]);
  }, [getActiveAccount]);

  return (
    <WalletContext.Provider value={{ account, connecting, connectWallet, getActiveAccount, disconnectWallet, signTransactions, peraWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};
