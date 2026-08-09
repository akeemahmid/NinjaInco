"use client";

import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { activeChain } from "@/lib/network";
import { useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { useNinjaProgressionV2 } from "@/hooks/useNinjaProgressionV2";
import { useNinjaPromotionV2 } from "@/hooks/useNinjaPromotionV2";

const ranks = ["Academy", "Chunin", "Jonin"];
const cards = [
  ["🥋", "Training Dojo", "Train your ninja and advance your confidential progression.", "/training"],
  ["⚔️", "Challenge Arena", "Choose a challenge, select your technique, and fight the Sensei.", "/duel"],
  ["📊", "Progression", "View your confidential training and battle progress.", "/progression"],
  ["🌀", "Techniques", "View available techniques and rank unlocks.", "/techniques"],
  ["🏯", "Challenges", "View available challenges and rank requirements.", "/challenges"],
  ["🔥", "Promotion", "Evaluate your promotion eligibility and advance your rank.", "/promotion"],
] as const;

function shortAddress(address?: string) { return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Wallet offline"; }
function ProgressBar({ label, value, target }: { label: string; value: bigint; target: bigint }) {
  const complete = value >= target;
  const width = `${Math.min(100, Number((value * BigInt(100)) / target))}%`;
  return <div><div className="flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{value.toString()} / {target.toString()}</span></div><div className="mt-2 h-2 overflow-hidden bg-white/10"><div className={`h-full ${complete ? "bg-emerald-300" : "bg-violet-300"}`} style={{ width }} /></div></div>;
}

export default function Home() {
  const { address, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const registration = useNinjaRegistration();
  const progression = useNinjaProgressionV2();
  const promotion = useNinjaPromotionV2();
  const rankIndex = progression.rank ?? 0;
  const rank = progression.rank === null ? "—" : ranks[rankIndex] ?? "—";
  const nextRank = rankIndex === 0 ? "Chunin" : rankIndex === 1 ? "Jonin" : "Final rank";
  const isWrongNetwork = !!address && chainId !== activeChain.id;
  const profile = registration.profile;

  return <main className="academy-hub min-h-[calc(100vh-65px)]"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
    <section className="academy-hero relative overflow-hidden p-6 sm:p-10"><div className="academy-sigil" aria-hidden="true">忍</div><div className="relative max-w-2xl"><p className="eyebrow text-violet-200/70">Welcome, shinobi</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">{profile?.displayName ?? "The academy awaits."}</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">Your path to becoming a Jonin begins here. Train in confidence, test your technique, and let the chain remember only what it must.</p><div className="mt-7 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]"><span className="academy-badge">{profile ? `${VILLAGES[profile.village] ?? "Unknown"} village` : "Unregistered ninja"}</span><span className="academy-badge">{rank} rank</span><span className="academy-badge">{shortAddress(address)}</span></div>{!address && <button className="btn-primary mt-8" onClick={openConnectModal}>Connect wallet</button>}{isWrongNetwork && <p className="mt-6 text-sm text-amber-200">Switch to Base Sepolia to enter the academy.</p>}</div></section>

    <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><section className="academy-card p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Current rank</p><h2 className="mt-3 text-3xl font-semibold">{rank}</h2></div><span className="rank-mark">{progression.rank === null ? "?" : String(rankIndex).padStart(2, "0")}</span></div>{progression.progress ? <div className="mt-8 space-y-5"><ProgressBar label="Training" value={progression.progress.trainingCount} target={rankIndex === 0 ? BigInt(2) : BigInt(4)} /><ProgressBar label="Victories" value={progression.progress.challengeWins} target={rankIndex === 0 ? BigInt(3) : BigInt(6)} /><p className="pt-2 text-xs uppercase tracking-[0.18em] text-white/35">Next rank · {nextRank}</p></div> : <div className="mt-8 border border-dashed border-white/15 p-5"><p className="text-sm text-white/60">Confidential Progress</p><p className="mt-2 text-xs text-white/35">Counters stay sealed until you request an attested reveal.</p><button className="btn-secondary mt-5" disabled={!address || isWrongNetwork || progression.isDecrypting} onClick={() => progression.readConfidentialProgress()}>{progression.isDecrypting ? "Decrypting…" : "Reveal Progress"}</button></div>}{progression.error && <p className="mt-4 text-xs text-red-300">{progression.error}</p>}</section>
      <section className="academy-card p-6 sm:p-8"><p className="eyebrow">Ninja profile</p><h2 className="mt-3 text-2xl font-semibold">{profile?.displayName ?? "Unknown shinobi"}</h2><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/45">Village</span><span>{profile ? VILLAGES[profile.village] : "—"}</span></div><div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/45">Rank</span><span>{rank}</span></div><div className="flex justify-between"><span className="text-white/45">Secret technique</span><span className="text-white/55">Sealed</span></div></div><Link className="btn-secondary mt-7 w-full" href="/profile">Open profile →</Link></section></div>

    <section className="mt-5 academy-card p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Promotion readiness</p><h2 className="mt-2 text-2xl font-semibold">{promotion.eligible ? "Promotion available" : `Path to ${nextRank}`}</h2><p className="mt-2 text-sm text-white/50">{promotion.eligible ? `You have fulfilled the requirements for ${nextRank}.` : "Reveal confidential progress, then begin your evaluation when ready."}</p></div>{promotion.eligible && <Link className="btn-primary" href="/promotion">Begin Promotion</Link>}</div></section>

    <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Academy doors</p><h2 className="mt-2 text-2xl font-semibold">Choose your next discipline</h2></div><span className="text-xs uppercase tracking-[0.18em] text-white/30">V2 journey</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([icon, title, copy, href]) => <Link className="academy-card academy-card-hover group p-6" href={href} key={href}><span className="text-2xl" aria-hidden="true">{icon}</span><h3 className="mt-6 text-lg font-semibold">{title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-white/45">{copy}</p><span className="mt-6 inline-block text-xs uppercase tracking-[0.18em] text-violet-200/65 transition-transform group-hover:translate-x-1">Enter →</span></Link>)}</div></section>
  </div></main>;
}
