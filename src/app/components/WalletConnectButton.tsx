// src/app/components/WalletConnectButton.tsx
"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

type WalletConnectButtonProps = {
  merchantSlug: string;
  memberId?: string;
};

export default function WalletConnectButton({
  merchantSlug,
  memberId,
}: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">(
    "idle"
  );

  // wagmi v2 style: use connectAsync for easier async/await flow
  const { connectAsync, isPending } = useConnect();

  // Helper to sync wallet address to backend
  async function syncWalletToBackend(addr: string) {
    if (!memberId) return;

    try {
      setStatus("syncing");

      const res = await fetch("/api/connect-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantSlug,
          memberId,
          address: addr,
        }),
      });

      if (!res.ok) {
        console.error("Failed to sync wallet", await res.json());
        setStatus("error");
        return;
      }

      setStatus("done");
    } catch (err) {
      console.error("Error calling /api/connect-wallet", err);
      setStatus("error");
    }
  }

  const handleClick = async () => {
    if (isConnected) {
      // Disconnect wallet
      setStatus("idle");
      disconnect();
      return;
    }

    try {
      setStatus("idle");

      const connector = injected({ shimDisconnect: true });

      // Connect wallet and get back connection data
      const result = await connectAsync({ connector });

      // Safely extract an address from the result, then fall back to useAccount
      let addr: string | undefined;

      if (result && typeof result === "object" && "account" in result) {
        const maybeAccount = (result as { account?: unknown }).account;
        if (typeof maybeAccount === "string") {
          addr = maybeAccount;
        }
      }

      if (!addr && typeof address === "string") {
        addr = address;
      }

      if (!addr) {
        console.error("No wallet address found after connect");
        setStatus("error");
        return;
      }

      await syncWalletToBackend(addr);
    } catch (error) {
      console.error("MetaMask connection error:", error);
      setStatus("error");
    }
  };

  let label = "Connect wallet";
  if (isPending) label = "Connecting...";
  if (status === "syncing") label = "Saving wallet…";
  if (status === "done") label = "Wallet connected ✔";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn btn-primary"
      disabled={isPending || status === "syncing"}
    >
      {label}
    </button>
  );
}
