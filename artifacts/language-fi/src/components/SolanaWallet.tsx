import { useState, useEffect } from "react";

interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

export default function SolanaWallet() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    const check = () => setHasPhantom(!!window.solana?.isPhantom);
    check();
    window.addEventListener("load", check);
    return () => window.removeEventListener("load", check);
  }, []);

  const connect = async () => {
    if (!window.solana) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const { publicKey } = await window.solana.connect();
      setPubkey(publicKey.toString());
    } catch {
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await window.solana?.disconnect();
    setPubkey(null);
  };

  if (pubkey) {
    return (
      <button className="sol-wallet-btn connected" onClick={disconnect} title="Click to disconnect">
        <span className="sol-dot" />
        {pubkey.slice(0, 4)}…{pubkey.slice(-4)}
      </button>
    );
  }

  return (
    <button className="sol-wallet-btn" onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : hasPhantom ? "Connect Wallet" : "Get Phantom"}
    </button>
  );
}
