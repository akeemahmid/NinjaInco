"use client";

import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { TECHNIQUES, useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { TransactionStatus } from "./TransactionStatus";
import { useNinjaProgressionV2 } from "@/hooks/useNinjaProgressionV2";
import { AttributeReveal } from "./AttributeReveal";

const V2_RANKS = ["Academy", "Chunin", "Jonin"];

function shortAddress(address: string) { return `${address.slice(0, 8)}…${address.slice(-6)}`; }

export function PlayerProfile() {
  const progression = useNinjaProgressionV2();
  const { openConnectModal } = useConnectModal();
  const { address, isConfigured, isRegistered, profile, decryptTechnique, decryptedTechnique, isDecrypting, busy, stage, isLoading, error } = useNinjaRegistration();

  if (!isConfigured) return <p className="profile-state">Set NEXT_PUBLIC_NINJAINCO_ADDRESS to load profiles.</p>;
  if (!address) return <div className="profile-empty"><div className="profile-empty-mark">忍</div><p className="eyebrow">Identity sealed</p><p className="mt-3 text-sm text-white/50">Connect your wallet to enter your ninja profile.</p><button className="btn-primary mt-6" onClick={openConnectModal}>Connect wallet</button></div>;
  if (isLoading) return <div className="profile-empty"><div className="profile-loading"/><p className="mt-5 text-sm text-white/50">Loading ninja identity…</p></div>;
  if (!isRegistered || !profile) return <div className="profile-empty"><p className="eyebrow">No identity found</p><p className="mt-3 text-sm text-white/50">Register your ninja before opening this record.</p><Link className="btn-primary mt-6" href="/register">Create ninja identity →</Link></div>;

  const rank = progression.rank === null ? "—" : V2_RANKS[progression.rank] ?? "—";
  const village = VILLAGES[profile.village] ?? "Unknown";
  return <div className="profile-layout">
    <section className="profile-hero"><div className="profile-hero-glow"/><div className="profile-seal"><span>忍</span></div><div className="relative mt-7"><p className="eyebrow text-violet-200/70">Ninja identity · public record</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{profile.displayName}</h2><div className="mt-5 flex flex-wrap justify-center gap-2 text-xs uppercase tracking-[0.16em]"><span className="profile-badge">{village} village</span><span className="profile-badge">{progression.isLoading ? "Loading rank…" : rank}</span><span className="profile-badge">{shortAddress(profile.wallet)}</span></div></div></section>

    <div className="profile-grid"><section className="profile-card"><p className="eyebrow">Public record</p><div className="mt-5 space-y-4 text-sm"><div className="profile-row"><span>Wallet</span><strong className="break-all text-right font-normal text-white/75">{profile.wallet}</strong></div><div className="profile-row"><span>Village</span><strong>{village}</strong></div><div className="profile-row"><span>Current V2 rank</span><strong>{progression.isLoading ? "Loading…" : rank}</strong></div><div className="profile-row"><span>Joined</span><strong>{new Date(Number(profile.createdAt) * 1000).toLocaleDateString()}</strong></div></div>{!progression.isConfigured && <p className="mt-5 text-xs text-red-300">V2 progression address is not configured.</p>}{progression.error && <p className="mt-5 text-xs text-red-300" role="alert">{progression.error}</p>}</section>
      <section className="profile-card"><p className="eyebrow">Village affiliation</p><h3 className="mt-3 text-2xl font-semibold">{village}</h3><p className="mt-2 text-sm leading-6 text-white/45">Your village is recorded by the registration contract and is presented here as an authoritative identity marker.</p><div className="mt-6 grid grid-cols-2 gap-2">{VILLAGES.map((item, index) => <div className={`profile-village ${index === profile.village ? "active" : ""}`} key={item}><span className="mr-2 text-violet-200/50">{index === profile.village ? "✦" : "·"}</span>{item}</div>)}</div></section></div>

    <section className="profile-card profile-confidential"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-violet-200/70">Confidential attribute record</p><h3 className="mt-2 text-2xl font-semibold">Ninja abilities</h3></div><span className="confidential-chip">Inco sealed</span></div><div className="mt-6"><AttributeReveal /></div></section>

    <section className="profile-technique"><div className="technique-orbit" aria-hidden="true"/><div className="relative"><p className="eyebrow text-violet-200/70">Confidential technique</p><h3 className="mt-2 text-2xl font-semibold">Secret Technique</h3>{decryptedTechnique === null ? <><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">This technique remains wallet-authorized and sealed until you request an attested reveal.</p><div className="profile-lock">封</div><button className="btn-secondary" disabled={busy} onClick={decryptTechnique}>{isDecrypting ? "Unsealing technique…" : "Reveal secret technique"}</button></> : <><p className="mt-6 text-3xl font-semibold text-violet-100">{TECHNIQUES[decryptedTechnique] ?? "Unknown"}</p><p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-200/70">Attested reveal complete</p></>}</div><TransactionStatus stage={stage}/>{error && <p className="relative mt-4 text-xs text-red-300" role="alert">{error}</p>}</section>
  </div>;
}
