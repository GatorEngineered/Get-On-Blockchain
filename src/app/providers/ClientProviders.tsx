"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

// Dynamically import WalletProvider with SSR disabled
// This prevents indexedDB errors during server-side rendering
const WalletProvider = dynamic(
  () => import("./WalletProviders").then((mod) => ({ default: mod.WalletProvider })),
  { ssr: false }
);

type ClientProvidersProps = {
  children: ReactNode;
};

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <WalletProvider>{children}</WalletProvider>;
}
