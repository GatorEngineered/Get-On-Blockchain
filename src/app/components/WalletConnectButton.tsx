"use client";

import { useEffect, useRef, useState } from "react";
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

  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">(
    "idle"
  );

  const hasSynced = useRef(false);

  async function syncWalletToBackend(addr: string) {
    if (!memberId) return;

    try {
      setStatus("syncing");

      const res = await fetch("/api/connect-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  useEffect(() => {
    if (isConnected && address && !hasSynced.current) {
      hasSynced.current = true;
      void syncWalletToBackend(address);
    }
  }, [isConnected, address]);

  const handleClick = async () => {
    if (isConnected) {
      hasSynced.current = false;
      setStatus("idle");
      disconnect();
      return;
    }

    try {
      const connector = injected({
        shimDisconnect: true,
      });

      await connect({ connector });
    } catch (e) {
      console.error("MetaMask connection error:", e);
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
      className={`btn btn-primary`}
      disabled={isPending || status === "syncing"}
    >
      {label}
    </button>
  );
}
