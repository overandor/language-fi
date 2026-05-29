import { useState, useEffect } from "react";

interface SolanaProvider {
  isPhantom?: boolean;
  isMetaMask?: boolean;
  publicKey?: { toString(): string };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (accounts: string[]) => void) => void;
      removeListener: (event: string, handler: (accounts: string[]) => void) => void;
    };
  }
}

export default function SolanaWallet() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<"phantom" | "metamask" | null>(null);

  const connectPhantom = async () => {
    if (!window.solana) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const { publicKey } = await window.solana.connect();
      setPubkey(publicKey.toString());
      setWalletType("phantom");
    } catch {
    } finally {
      setConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum?.isMetaMask) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        setPubkey(accounts[0]);
        setWalletType("metamask");
      }
    } catch {
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (walletType === "phantom") {
      await window.solana?.disconnect();
    }
    setPubkey(null);
    setWalletType(null);
  };

  if (pubkey) {
    return (
      <button className="sol-wallet-btn connected" onClick={disconnect} title="Click to disconnect">
        <span className="sol-dot" />
        {walletType === "metamask" ? "MetaMask" : "Solana"}: {pubkey.slice(0, 4)}…{pubkey.slice(-4)}
      </button>
    );
  }

  return (
    <div className="wallet-buttons">
      <button className="sol-wallet-btn" onClick={connectPhantom} disabled={connecting}>
        {connecting ? "Connecting…" : "Phantom"}
      </button>
      <button className="sol-wallet-btn metamask" onClick={connectMetaMask} disabled={connecting}>
        {connecting ? "Connecting…" : "MetaMask 🦊"}
      </button>
    </div>
  );
}
