"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { DUEL_TECHNIQUES, useNinjaDuel } from "@/hooks/useNinjaDuel";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";
import { TransactionStatus } from "./TransactionStatus";

const TECHNIQUE_META = [
  { name: "Shadow Blade", description: "A silent edge drawn from the dark.", icon: "✦", tone: "shadow" },
  { name: "Spirit Guard", description: "A vow of stillness around your spirit.", icon: "◇", tone: "spirit" },
  { name: "Phantom Step", description: "Move before the world knows you were there.", icon: "◌", tone: "phantom" },
] as const;
const NARRATIVES = ["The techniques meet in perfect balance. The shrine records a draw.", "Your hidden technique breaks through the Sensei's defense.", "The Sensei reads the moment and turns your attack aside."];

function Seal({ tone = "" }: { tone?: string }) { return <div className={`ninja-seal ${tone}`} aria-hidden="true"><span>忍</span></div>; }

export function ConfidentialDuel() {
  const reduceMotion = useReducedMotion();
  const { openConnectModal } = useConnectModal();
  const duel = useNinjaDuel();
  const registration = useNinjaRegistration();
  const { address, chainId } = useAccount();
  const [selectedTechnique, setSelectedTechnique] = useState<number | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  useEffect(() => { setSelectedTechnique(null); setBattleStarted(false); }, [address, chainId]);
  useEffect(() => { if (["refreshing-duel-id", "ready-to-reveal", "revealing", "complete"].includes(duel.lifecycle)) setBattleStarted(true); }, [duel.lifecycle]);

  if (!duel.address) return <button className="btn-primary" onClick={openConnectModal}>Connect to enter the exam</button>;
  if (!duel.isConfigured) return <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_NINJAINCO_DUEL_ADDRESS to enable duels.</p>;
  if (!duel.isRegistered) return <p className="text-sm">Register your ninja first. <Link className="underline" href="/register">Register →</Link></p>;

  if (duel.result) {
    const won = duel.result.outcome === 1; const draw = duel.result.outcome === 0;
    return <section className="dojo-panel space-y-6 p-6 text-center md:p-10"><p className="eyebrow">duel complete</p><h2 className="text-2xl font-medium">{draw ? "Draw" : won ? "You Win" : "Sensei Wins"}</h2><div className="mx-auto flex max-w-xs items-center justify-center gap-3 text-sm"><span className="border border-border px-3 py-2">{DUEL_TECHNIQUES[duel.result.playerTechnique]}</span><span className="text-muted-foreground">vs</span><span className="border border-border px-3 py-2">{DUEL_TECHNIQUES[duel.result.senseiTechnique]}</span></div><p className="text-sm text-muted-foreground">{NARRATIVES[duel.result.outcome]}</p><Link className="btn-secondary" href={won ? "/academy" : "/dojo"}>{won ? "Continue to Academy →" : "Train again →"}</Link></section>;
  }

  if (battleStarted) return <section className="dojo-panel flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><Seal tone={selectedTechnique !== null ? TECHNIQUE_META[selectedTechnique].tone : ""}/><p className="eyebrow mt-8">{duel.lifecycle === "refreshing-duel-id" ? "confidential computation" : "exam scroll sent"}</p><p className="mt-4 text-lg">{duel.lifecycle === "refreshing-duel-id" ? "The hidden result is being prepared..." : "The Sensei meets your hidden technique..."}</p><div className="mt-6 w-full max-w-sm"><TransactionStatus stage={duel.stage}/></div><button className="btn-secondary mt-6" disabled={!duel.canReveal} onClick={duel.revealDuel}>Reveal completed duel</button>{duel.error && <p role="alert" className="mt-4 text-sm text-destructive">{duel.error}</p>}</section>;

  const sealing = duel.isEncrypting || duel.lifecycle === "submitting" || duel.lifecycle === "confirming";
  return <div className="dojo-panel space-y-10 p-5 sm:p-8 md:p-10">
    <div className="game-hud"><div><p className="eyebrow">Ninja Exam</p><p className="mt-1 text-sm font-medium">Stage 02 · Secret Technique</p></div><div className="text-right"><p className="text-xs text-muted-foreground">{registration.profile?.displayName ?? "Unknown ninja"}</p><p className="mt-1 text-xs text-muted-foreground">{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Wallet offline"}</p></div><div className="journey-track"><span className="active"/><span className="active"/><span/><span/></div></div>
    <div className="relative grid gap-8 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-6 text-center sm:p-10"><div className="dojo-moon"/><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .7 }} className="relative"><Seal/><p className="eyebrow mt-7">The masked Sensei</p><h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">THE NINJA EXAM</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your technique will remain hidden.<br/>Your opponent&apos;s technique will remain hidden.<br/><span className="text-foreground/80">Only the result will be revealed.</span></p></motion.div></div>
    <div><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Choose your secret technique</p><p className="mt-2 text-sm text-muted-foreground">The choice is sealed before it leaves your hands.</p></div><span className="text-xs text-muted-foreground">{selectedTechnique === null ? "Select one" : "Ready"}</span></div><div className="grid gap-3 md:grid-cols-3">{TECHNIQUE_META.map((item, index) => { const selected = selectedTechnique === index; return <motion.button type="button" key={item.name} disabled={duel.busy} onClick={() => setSelectedTechnique(index)} whileHover={reduceMotion ? undefined : { y: -5 }} whileTap={reduceMotion ? undefined : { scale: .98 }} className={`technique-card ${item.tone} ${selected ? "selected" : selectedTechnique !== null ? "dimmed" : ""}`} aria-pressed={selected}><span className="technique-glyph">{item.icon}</span><span className="relative mt-5 block text-left"><span className="block text-base font-medium tracking-wide">{item.name}</span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.description}</span></span>{selected && <motion.span layoutId="selection-ring" className="selection-ring" transition={{ duration: reduceMotion ? 0 : .2 }} />}</motion.button>; })}</div></div>
    <AnimatePresence mode="wait"><motion.div key={sealing ? "sealing" : "ready"} initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .2 }}><button className="btn-primary min-h-14 w-full text-xs uppercase tracking-[0.2em]" disabled={selectedTechnique === null || duel.busy} onClick={() => selectedTechnique !== null && duel.startDuel(selectedTechnique)}>{sealing ? "Sealing technique…" : "Enter the duel"}</button>{sealing && <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground"><span className="seal-dot"/> {duel.isEncrypting ? "Sealing your technique…" : duel.lifecycle === "confirming" ? "Sending the exam scroll…" : "Awaiting authorization…"}</div>}</motion.div></AnimatePresence>
    <TransactionStatus stage={duel.stage}/>{duel.error && <p role="alert" className="text-sm text-destructive">{duel.error}</p>}
  </div>;
}
