"use client";

import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { TECHNIQUES, useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { TransactionStatus } from "./TransactionStatus";

export function PlayerProfile() {
  const { openConnectModal } = useConnectModal();
  const {
    address,
    isConfigured,
    isRegistered,
    profile,
    decryptTechnique,
    decryptedTechnique,
    isDecrypting, busy, stage,
    isLoading,
    error,
  } = useNinjaRegistration();

  if (!isConfigured) return <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_NINJAINCO_ADDRESS to load profiles.</p>;
  if (!address) return <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>connect wallet to view profile</button>;
  if (isLoading) return <p className="text-sm text-muted-foreground">loading profile...</p>;
  if (!isRegistered || !profile) return <p className="text-sm">No ninja found. <Link className="underline" href="/register">Create one →</Link></p>;

  return (
    <div className="surface space-y-5 p-6 text-sm sm:p-8">
      <div><span className="text-muted-foreground">display name:</span> {profile.displayName}</div>
      <div><span className="text-muted-foreground">village:</span> {VILLAGES[profile.village] ?? "Unknown"}</div>
      <div className="break-all"><span className="text-muted-foreground">wallet:</span> {profile.wallet}</div>
      <div><span className="text-muted-foreground">created:</span> {new Date(Number(profile.createdAt) * 1000).toLocaleString()}</div>
      <div className="border-t border-border pt-4">
        {decryptedTechnique === null ? (
          <button className="btn-secondary" disabled={busy} onClick={decryptTechnique}>
            {isDecrypting ? "decrypting..." : "reveal my secret technique"}
          </button>
        ) : (
          <p><span className="text-muted-foreground">secret technique:</span> {TECHNIQUES[decryptedTechnique] ?? "Unknown"}</p>
        )}
      </div>
      <TransactionStatus stage={stage} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
