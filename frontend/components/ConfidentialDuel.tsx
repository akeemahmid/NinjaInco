"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { DUEL_TECHNIQUES, useNinjaDuel } from "@/hooks/useNinjaDuel";
import { TransactionStatus } from "./TransactionStatus";

const NARRATIVES = [
  "The techniques meet in perfect balance. The shrine records a draw.",
  "Your hidden technique breaks through the Sensei's defense.",
  "The Sensei reads the moment and turns your attack aside.",
];

export function ConfidentialDuel() {
  const { openConnectModal } = useConnectModal();
  const duel = useNinjaDuel();
  const { address, chainId } = useAccount();
  const [selectedTechnique, setSelectedTechnique] = useState<number | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  useEffect(() => {
    // Do not retain a prior wallet's selected or decrypted duel state.
    setSelectedTechnique(null); setBattleStarted(false);
  }, [address, chainId]);

  useEffect(() => {
    if (["refreshing-duel-id", "ready-to-reveal", "revealing", "complete"].includes(duel.lifecycle)) setBattleStarted(true);
  }, [duel.lifecycle]);

  if (!duel.address) return <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>connect wallet to enter the duel</button>;
  if (!duel.isConfigured) return <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_NINJAINCO_DUEL_ADDRESS to enable duels.</p>;
  if (!duel.isRegistered) return <p className="text-sm">Register your ninja first. <Link className="underline" href="/register">Register →</Link></p>;

  if (duel.result) {
    const won = duel.result.outcome === 1;
    const draw = duel.result.outcome === 0;
    return <section className="space-y-6 border border-border bg-card/30 p-6 text-center md:p-10"><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">duel complete</p><h2 className="text-2xl font-medium">{draw ? "Draw" : won ? "You Win" : "Sensei Wins"}</h2><div className="mx-auto flex max-w-xs items-center justify-center gap-3 text-sm"><span className="border border-border px-3 py-2">{DUEL_TECHNIQUES[duel.result.playerTechnique]}</span><span className="text-muted-foreground">vs</span><span className="border border-border px-3 py-2">{DUEL_TECHNIQUES[duel.result.senseiTechnique]}</span></div><p className="text-sm text-muted-foreground">{NARRATIVES[duel.result.outcome]}</p>{won ? <p className="text-sm font-medium">Promotion Progress +1</p> : <p className="text-sm text-muted-foreground">{draw ? "The next lesson may turn the tide." : "Train again, then return to the dojo."}</p>}<Link className="inline-block border border-border px-4 py-2 text-sm" href={won ? "/academy" : "/dojo"}>{won ? "Continue to Academy →" : "Train again →"}</Link></section>;
  }
  if (battleStarted) return <section className="surface flex min-h-[360px] flex-col items-center justify-center p-8 text-center"><div className="mb-8 flex gap-4"><div className="h-12 w-12 animate-ping rounded-full bg-foreground/20"/><div className="h-12 w-12 animate-pulse rounded-full bg-foreground/10"/></div><p className="eyebrow">confidential clash</p><p className="mt-4 text-lg">{duel.lifecycle === "refreshing-duel-id" ? "Confirming your latest duel record..." : "The Sensei meets your hidden technique..."}</p><div className="mt-6 w-full max-w-sm"><TransactionStatus stage={duel.stage}/></div><button className="btn-secondary mt-6" disabled={!duel.canReveal} onClick={duel.revealDuel}>Reveal completed duel</button>{duel.error && <p role="alert" className="mt-4 text-sm text-destructive">{duel.error}</p>}</section>;

  return <section className="surface space-y-5 p-6 md:p-8"><p className="text-sm leading-6 text-muted-foreground">Choose one technique. The Sensei's choice is made inside the contract and neither choice is revealed before the duel resolves.</p><div className="grid gap-3 sm:grid-cols-3">{DUEL_TECHNIQUES.map((technique, index) => <button className={`border p-4 text-left text-sm transition-all hover:-translate-y-0.5 ${selectedTechnique === index ? "border-foreground bg-foreground/10 shadow-md" : "border-border hover:border-foreground/40"}`} disabled={duel.busy} key={technique} onClick={() => setSelectedTechnique(index)}>{technique}</button>)}</div><button className="btn-primary w-full" disabled={selectedTechnique === null || duel.busy} onClick={() => selectedTechnique !== null && duel.startDuel(selectedTechnique)}>Begin duel</button><TransactionStatus stage={duel.stage}/>{duel.error && <p role="alert" className="text-sm text-destructive">{duel.error}</p>}</section>;
}
