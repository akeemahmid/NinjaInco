"use client";

import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { TECHNIQUES, useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { TransactionStatus } from "./TransactionStatus";
import { useNinjaPromotion } from "@/hooks/useNinjaPromotion";

export function PlayerProfile() {
  const promotion = useNinjaPromotion();
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
    <div className="dojo-panel grid gap-8 p-6 text-sm sm:p-9 md:grid-cols-[.8fr_1.2fr]">
      <section className="text-center md:border-r md:border-white/10 md:pr-8"><div className="ninja-seal"><span>忍</span></div><p className="eyebrow mt-6">{VILLAGES[profile.village] ?? "Unknown"} village</p><h2 className="mt-2 text-3xl font-medium">{profile.displayName}</h2><p className="mt-3 text-muted-foreground">Rank · {promotion.rank === 1 ? "Genin" : "Initiate"}</p></section>
      <section className="space-y-5"><div className="game-card"><p className="eyebrow">public record</p><div className="mt-4 break-all text-xs text-muted-foreground">{profile.wallet}</div><div className="mt-3 text-xs text-muted-foreground">Joined {new Date(Number(profile.createdAt) * 1000).toLocaleDateString()}</div></div>
      <div className="game-card text-center">
        {decryptedTechnique === null ? (
          <><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-dashed border-white/20 text-2xl">封</div><p className="eyebrow mt-4">sealed technique</p><p className="mt-2 text-xs text-muted-foreground">Only this wallet can request an attested reveal.</p><button className="btn-secondary mt-5" disabled={busy} onClick={decryptTechnique}>{isDecrypting ? "Unsealing technique..." : "Reveal my secret technique"}</button></>
        ) : (
          <><p className="eyebrow">technique revealed</p><p className="mt-3 text-xl">{TECHNIQUES[decryptedTechnique] ?? "Unknown"}</p></>
        )}
      </div>
      <TransactionStatus stage={stage} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      </section>
    </div>
  );
}
