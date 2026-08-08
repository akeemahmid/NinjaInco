"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useNinjaPromotion } from "@/hooks/useNinjaPromotion";
import { TransactionStatus } from "./TransactionStatus";

export function PromotionCeremony() {
  const { openConnectModal } = useConnectModal(); const promotion = useNinjaPromotion(); const { chainId } = useAccount(); const [started, setStarted] = useState(false);
  useEffect(() => { setStarted(false); }, [promotion.address, chainId]);
  if (!promotion.address) return <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>connect wallet to attend the ceremony</button>;
  if (!promotion.isConfigured) return <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_NINJAINCO_PROMOTION_ADDRESS to enable promotion.</p>;
  if (promotion.isLoading) return <p className="animate-pulse text-sm text-muted-foreground">the council is assembling...</p>;
  if (!promotion.isRegistered) return <p className="text-sm">Only registered ninjas may stand before the council. <Link className="underline" href="/register">Register →</Link></p>;
  if (promotion.rank === 1) return <section className="space-y-7 border border-border bg-card/30 p-8 text-center md:p-12"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-foreground text-3xl animate-pulse">忍</div><p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">rank bestowed</p><h2 className="text-3xl font-medium">Genin</h2><p className="text-lg">A new path has opened.</p><div className="mx-auto w-fit border border-foreground px-4 py-2 text-xs uppercase tracking-wider">Genin Badge Unlocked</div><Link className="inline-block bg-foreground px-5 py-3 text-sm text-background" href="/academy">Return to Academy →</Link></section>;
  if (promotion.eligible === false) return <section className="space-y-5 border border-border bg-card/30 p-8 text-center"><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">council decision</p><h2 className="text-2xl font-medium">You require more training.</h2><Link className="inline-block border border-border px-4 py-2 text-sm" href="/dojo">Return to the dojo →</Link></section>;
  if (started) return <section className="surface flex min-h-[380px] flex-col items-center justify-center p-8 text-center"><div className="relative mb-8 h-28 w-28"><div className="absolute inset-0 animate-spin rounded-full border border-foreground/30 border-t-foreground"/><div className="absolute inset-5 animate-pulse rounded-full bg-foreground/10"/></div><p className="eyebrow">confidential judgment</p><p className="mt-4 text-lg">The council weighs the path you have walked...</p><p className="mt-4 text-xs text-muted-foreground">No experience or hidden attribute is revealed.</p><div className="mt-6 w-full max-w-sm"><TransactionStatus stage={promotion.stage}/></div>{promotion.error && <p role="alert" className="mt-4 text-sm text-destructive">{promotion.error}</p>}</section>;
  return <section className="surface p-8 text-center md:p-12"><p className="eyebrow">hall of ascension</p><h2 className="mt-5 text-2xl font-medium">Stand before the village council.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your deeds will be judged in confidence. The council will learn only whether your path may continue.</p><button className="btn-primary mt-8" disabled={promotion.busy} onClick={() => { setStarted(true); promotion.evaluate(); }}>Begin Promotion Ceremony</button></section>;
}
