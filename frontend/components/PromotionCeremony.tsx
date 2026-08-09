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
  if (promotion.rank === 1) return <section className="dojo-panel space-y-7 p-8 text-center md:p-12"><div className="ninja-seal"><span>忍</span></div><p className="eyebrow">rank bestowed</p><h2 className="text-3xl font-medium">Genin</h2><p className="text-lg">A new path has opened.</p><Link className="btn-primary" href="/academy">Return to Academy →</Link></section>;
  if (promotion.eligible === false) return <section className="dojo-panel space-y-5 p-8 text-center"><p className="eyebrow">council decision</p><h2 className="text-2xl font-medium">More training is required.</h2><Link className="btn-secondary" href="/dojo">Return to the dojo →</Link></section>;
  if (started) return <section className="dojo-panel flex min-h-[400px] flex-col items-center justify-center p-8 text-center"><div className="ninja-seal"><span>判</span></div><p className="eyebrow mt-8">confidential judgment</p><p className="mt-4 text-lg">The council weighs the path you have walked...</p><div className="mt-6 w-full max-w-sm"><TransactionStatus stage={promotion.stage}/></div>{promotion.error && <p role="alert" className="mt-4 text-sm text-destructive">{promotion.error}</p>}</section>;
  return <section className="dojo-panel p-8 text-center md:p-12"><p className="eyebrow">final examination</p><h2 className="mt-5 text-2xl font-medium">Stand before the village council.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your deeds will be judged in confidence. The council will learn only whether your path may continue.</p><button className="btn-primary mt-8" disabled={promotion.busy} onClick={() => { setStarted(true); promotion.evaluate(); }}>Begin examination</button></section>;
}
