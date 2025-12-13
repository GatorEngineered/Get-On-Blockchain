// src/app/components/WalletConnectButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type WalletConnectButtonProps = {
  merchantSlug: string;
  memberId?: string;
};

export default function WalletConnectButton({
  merchantSlug,
  memberId,
}: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<"idle" | "verifying" | "syncing" | "done" | "error">(
    "idle"
  );
  const [lastSyncedAddress, setLastSyncedAddress] = useState<string | null>(null);

  // Sync wallet to backend with signature verification
  async function syncWalletToBackend(addr: string) {
    if (!memberId) return;
    if (lastSyncedAddress === addr) return; // Already synced

    try {
      setStatus("verifying");

      // Step 1: Request a nonce from backend
      const nonceRes = await fetch("/api/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });

      if (!nonceRes.ok) {
        console.error("Failed to get nonce", await nonceRes.json());
        setStatus("error");
        return;
      }

      const { nonce } = await nonceRes.json();

      // Step 2: Sign the nonce with user's wallet
      const message = `Sign this message to verify your wallet ownership.\n\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });

      setStatus("syncing");

      // Step 3: Send signature to backend for verification
      const res = await fetch("/api/connect-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantSlug,
          memberId,
          address: addr,
          signature,
          message,
        }),
      });

      if (!res.ok) {
        console.error("Failed to sync wallet", await res.json());
        setStatus("error");
        return;
      }

      setStatus("done");
      setLastSyncedAddress(addr);
    } catch (err) {
      console.error("Error syncing wallet", err);
      setStatus("error");
    }
  }

  // Auto-sync when wallet connects
  useEffect(() => {
    if (isConnected && address && memberId && lastSyncedAddress !== address) {
      syncWalletToBackend(address);
    }
  }, [isConnected, address, memberId]);

  return (
    <div className="wallet-connect-wrapper">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="btn btn-primary"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="btn btn-warning"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={openChainModal}
                      style={{ display: "flex", alignItems: "center" }}
                      type="button"
                      className="btn btn-secondary"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: "hidden",
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="btn btn-primary"
                    >
                      {status === "verifying" && "Verifying..."}
                      {status === "syncing" && "Saving..."}
                      {status === "done" && "✓ "}
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ""}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {status === "error" && (
        <p style={{ color: "red", marginTop: 8, fontSize: 14 }}>
          Failed to connect wallet. Please try again.
        </p>
      )}
    </div>
  );
}
