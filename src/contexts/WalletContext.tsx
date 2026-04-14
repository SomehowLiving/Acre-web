import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";

interface WalletContextValue {
  account: string | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
  peraWallet: PeraWalletConnect;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const peraWallet = new PeraWalletConnect();

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
        if (mounted && accounts?.length) setAccount(accounts[0]);
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
      if (!accounts?.length) throw new Error("No wallet account returned");
      setAccount(accounts[0]);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await peraWallet.disconnect();
    setAccount(null);
  }, []);

  const signTransactions = useCallback(async (txns: algosdk.Transaction[]) => {
    const txGroup = txns.map((txn) => ({ txn }));
    return peraWallet.signTransaction([txGroup]);
  }, []);

  return (
    <WalletContext.Provider value={{ account, connecting, connectWallet, disconnectWallet, signTransactions, peraWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};
