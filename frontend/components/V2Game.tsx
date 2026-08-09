"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { bytesToHex } from "viem";
import { activeChain } from "@/lib/network";
import { useNinjaChallenges } from "@/hooks/useNinjaChallenges";
import { useNinjaDuelV2 } from "@/hooks/useNinjaDuelV2";
import { useNinjaProgressionV2 } from "@/hooks/useNinjaProgressionV2";
import { useNinjaTechniques } from "@/hooks/useNinjaTechniques";
import { useNinjaTrainingV2 } from "@/hooks/useNinjaTrainingV2";
import { useNinjaPromotionV2 } from "@/hooks/useNinjaPromotionV2";

const ranks = ["Academy", "Chunin", "Jonin"];
const outcomes = ["DRAW", "WIN", "LOSS"];

export function V2Game() {
  const { address, chainId } = useAccount();
  const progression = useNinjaProgressionV2();
  const techniques = useNinjaTechniques(progression.rank);
  const challenges = useNinjaChallenges(progression.rank);
  const training = useNinjaTrainingV2();
  const duel = useNinjaDuelV2();
  const promotion = useNinjaPromotionV2();
  const [technique, setTechnique] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<bigint | null>(null);
  const rank = progression.rank === null ? "—" : ranks[progression.rank] ?? "—";
  const ready = !!address && chainId === activeChain.id;
  const canPlay = ready && technique !== null && challenge !== null && !duel.busy;
  const actionId = () => { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return bytesToHex(bytes); };
  const selectedChallenge = useMemo(() => challenges.enterableChallenges.find((x) => x.id === challenge), [challenges.enterableChallenges, challenge]);
  const revealedPlayerTechnique = duel.result ? techniques.techniques.find((item) => BigInt(item.id) === duel.result?.playerTechnique) : undefined;
  const revealedSenseiTechnique = duel.result ? techniques.techniques.find((item) => BigInt(item.id) === duel.result?.opponentTechnique) : undefined;
  const evaluation = promotion.evaluation as readonly [number, number, `0x${string}`, boolean] | undefined;
  useEffect(() => { if (!promotion.isSuccess) return; void progression.refetchRank(); void progression.readConfidentialProgress(); void techniques.refetch(); void challenges.refetch(); }, [promotion.isSuccess]);
  useEffect(() => {
    if (!duel.isSettleSuccess || duel.duelId === null) return;
    void duel.retrieve(duel.duelId);
    void progression.readConfidentialProgress();
  }, [duel.isSettleSuccess, duel.duelId, duel.retrieve, progression.readConfidentialProgress]);
  const promotionLabel = promotion.status === "evaluating" ? "Confirm evaluation in wallet…" : promotion.status === "awaiting-attestation" ? "Waiting for Inco attestation…" : promotion.status === "ready-to-finalize" ? "Attestation received" : promotion.status === "finalizing" ? "Confirm finalization…" : promotion.status === "success" ? (rank === "Jonin" ? "Jonin — final rank" : "Promotion complete") : evaluation?.[3] ? "Evaluation created" : "No evaluation";
  return <main className="page-shell wide">
    <div className="mx-auto max-w-6xl"><p className="eyebrow">V2 testnet game</p><h1 className="page-title">Ninja progression</h1><p className="page-description">Confidential training and duels on Base Sepolia.</p>
      {!address && <div className="surface mt-8 p-5">Connect your wallet to enter the V2 game.</div>}
      {address && chainId !== activeChain.id && <div className="surface mt-8 border-destructive p-5 text-destructive">Switch to Base Sepolia before using V2.</div>}
      {address && <div className="mt-8 grid gap-5 md:grid-cols-3"><section className="surface p-5"><p className="eyebrow">Player</p><p className="mt-3 break-all text-sm">{address}</p><p className="mt-5 text-2xl font-semibold">{rank}</p><p className="mt-1 text-xs text-muted-foreground">Public rank</p></section><section className="surface p-5"><p className="eyebrow">Confidential progress</p><p className="mt-4 text-sm">Training: {progression.progress ? progression.progress.trainingCount.toString() : "Not revealed"}</p><p className="mt-2 text-sm">Wins: {progression.progress ? progression.progress.challengeWins.toString() : "Not revealed"}</p><button className="btn-secondary mt-5" disabled={progression.isDecrypting} onClick={() => progression.readConfidentialProgress()}>{progression.isDecrypting ? "Decrypting…" : "Reveal my progress"}</button></section><section className="surface p-5"><p className="eyebrow">Promotion</p><p className="mt-4 text-sm">{promotionLabel}</p><div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" disabled={!ready || promotion.isPending || promotion.isConfirming || rank === "Jonin" || promotion.status === "awaiting-attestation"} onClick={() => promotion.evaluate()}>Evaluate promotion</button>{promotion.status === "ready-to-finalize" && <button className="btn-secondary" disabled={promotion.isPending || promotion.isConfirming} onClick={() => promotion.finalize()}>Finalize promotion</button>}</div>{promotion.error && <p className="mt-3 text-sm text-destructive">{promotion.error}</p>}</section></div>}
      {address && <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="surface p-5"><p className="eyebrow">Training</p><p className="mt-3 text-sm">One click records exactly one confidential training action.</p><button className="btn-primary mt-5" disabled={!ready || training.isPending || training.isConfirming} onClick={() => training.train(actionId())}>{training.isPending ? "Confirm in wallet…" : training.isConfirming ? "Confirming…" : training.isSuccess ? "Training complete" : "Train"}</button>{training.error && <p className="mt-3 text-sm text-destructive">{training.error}</p>}</section><section className="surface p-5"><p className="eyebrow">Progression</p><div className="mt-5 flex items-center gap-2 text-sm">{ranks.map((item, i) => <span key={item} className={i === progression.rank ? "font-semibold" : "text-muted-foreground"}>{item}{i < 2 ? " → " : ""}</span>)}</div></section></div>}
      {address && <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="surface p-5"><p className="eyebrow">Techniques</p><div className="mt-4 grid gap-2">{techniques.techniques.map((x) => <button key={x.id} disabled={!x.unlocked} onClick={() => setTechnique(x.id)} className={`border p-3 text-left text-sm ${technique === x.id ? "border-foreground" : "border-border"} ${!x.unlocked ? "opacity-45" : ""}`}>#{x.id} {x.name} <span className="float-right text-xs">{x.unlocked ? "Unlocked" : `Rank ${ranks[x.requiredRank]}`}</span></button>)}</div></section><section className="surface p-5"><p className="eyebrow">Challenges</p><div className="mt-4 grid gap-2">{challenges.challenges.map((x) => <button key={x.id.toString()} disabled={!x.canEnter} onClick={() => setChallenge(x.id)} className={`border p-3 text-left text-sm ${challenge === x.id ? "border-foreground" : "border-border"} ${!x.canEnter ? "opacity-45" : ""}`}>#{x.id.toString()} {x.name}<span className="float-right text-xs">{x.canEnter ? "Available" : `Requires ${ranks[x.requiredRank]}`}</span></button>)}</div></section></div>}
      {address && <section className="surface mt-5 p-5"><p className="eyebrow">Duel</p><p className="mt-3 text-sm">{selectedChallenge ? `Challenge: ${selectedChallenge.name}` : "Select a challenge and technique above."}</p><button className="btn-primary mt-5" disabled={!canPlay} onClick={() => duel.play(challenge!, technique!)}>{duel.isEncrypting ? "Encrypting…" : duel.isDuelPending ? "Confirm in wallet…" : duel.isDuelConfirming ? "Resolving…" : "Start confidential duel"}</button>{duel.duelId !== null && <><p className="mt-4 text-sm">Duel ID: {duel.duelId.toString()}</p><div className="mt-4 flex gap-2"><button className="btn-secondary" disabled={duel.isDecrypting} onClick={() => duel.retrieve()}>{duel.isDecrypting ? "Decrypting…" : duel.result ? "Refresh result" : "Reveal result"}</button><button className="btn-secondary" disabled={!duel.result || duel.result.settled || duel.isSettlePending || duel.isSettleConfirming} onClick={() => duel.settleDuel()}>{duel.isSettlePending ? "Confirm in wallet…" : duel.isSettleConfirming ? "Settling…" : duel.result?.settled ? "Duel settled" : "Settle duel"}</button></div></>}{duel.result && <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-border p-4"><p className="eyebrow">Your Technique</p><p className="mt-2 font-semibold">{revealedPlayerTechnique?.name ?? `Unknown technique #${duel.result.playerTechnique.toString()}`}</p></div><div className="border border-border p-4"><p className="eyebrow">Sensei Technique</p><p className="mt-2 font-semibold">{revealedSenseiTechnique?.name ?? `Unknown technique #${duel.result.opponentTechnique.toString()}`}</p></div><div className="border border-border p-4"><p className="eyebrow">Battle Result</p><p className="mt-2 text-xl font-semibold">{outcomes[Number(duel.result.outcome)] ?? "UNKNOWN"}</p></div></div>}{duel.error && <p className="mt-3 text-sm text-destructive">{duel.error}</p>}</section>}
    </div></main>;
}
