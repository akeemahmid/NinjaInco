"use client";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";
import { type RevealedAttributes, useNinjaAttributes } from "@/hooks/useNinjaAttributes";
import { TransactionStatus } from "./TransactionStatus";

const STYLES = ["Shadow", "Spirit", "Phantom"] as const;
const GLYPHS = ["力", "迅", "心", "運", "気"];
function level(value: number) { return value < 40 ? { label: "Low", segments: 1 } : value < 70 ? { label: "Medium", segments: 2 } : { label: "High", segments: 3 }; }
function StatCard({ label, value, glyph }: { label: string; value: number; glyph: string }) { const item = level(value); return <article className="stat-card"><div className="flex items-start justify-between"><span className="stat-glyph">{glyph}</span><span className="text-xs uppercase tracking-[0.16em] text-white/35">{item.label}</span></div><h4 className="mt-5 text-lg font-semibold">{label}</h4><div className="mt-4 grid grid-cols-3 gap-2">{[1,2,3].map((n) => <span className={`stat-segment ${n <= item.segments ? "active" : ""}`} key={n}/>)}</div></article>; }
function Revealed({ attributes }: { attributes: RevealedAttributes }) { const stats = [["Power",attributes.power],["Speed",attributes.speed],["Focus",attributes.focus],["Luck",attributes.luck],["Chakra",attributes.chakra]] as const; return <div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{stats.map(([label,value], index) => <StatCard glyph={GLYPHS[index]} key={label} label={label} value={value}/>)}</div><div className="starting-style mt-3"><div><p className="eyebrow">Starting style</p><p className="mt-2 text-xl font-semibold">{STYLES[attributes.startingStyle] ?? "Unknown"}</p></div><span className="text-xs text-white/35">Exact numeric values remain concealed.</span></div></div>; }

export function AttributeReveal() {
  const { openConnectModal } = useConnectModal(); const registration = useNinjaRegistration(); const attributes = useNinjaAttributes();
  if (!registration.address) return <button className="btn-secondary" onClick={openConnectModal}>Connect wallet</button>;
  if (!registration.isConfigured || !attributes.isConfigured) return <p className="text-sm text-white/45">Configure the registry and attributes contract addresses to continue.</p>;
  if (registration.isLoading || attributes.isLoading) return <div className="attribute-sealed"><div className="profile-loading"/><p>Loading confidential character…</p></div>;
  if (!registration.isRegistered) return <p className="text-sm">Create a ninja first. <Link className="underline" href="/register">Register →</Link></p>;
  if (!attributes.hasAttributes) return <div className="attribute-sealed"><span className="text-3xl text-violet-200/60">醒</span><p className="mt-4 text-sm text-white/55">Generate confidential attributes for this registered ninja.</p><button className="btn-primary mt-5" disabled={attributes.busy} onClick={attributes.initializeAttributes}>Initialize confidential attributes</button><TransactionStatus stage={attributes.stage}/>{attributes.error && <p role="alert" className="mt-4 text-sm text-red-300">{attributes.error}</p>}</div>;
  return <div>{attributes.revealedAttributes ? <Revealed attributes={attributes.revealedAttributes}/> : <div className="attribute-sealed"><div className="profile-lock">封</div><p className="text-sm text-white/55">Power, Speed, Focus, Luck, Chakra, and Starting Style are stored as wallet-authorized Inco handles.</p><button className="btn-primary mt-5" disabled={attributes.busy} onClick={attributes.revealMyAttributes}>{attributes.isDecrypting ? "Decrypting attributes…" : "Reveal my attributes"}</button><TransactionStatus stage={attributes.stage}/></div>}{attributes.error && <p role="alert" className="mt-4 text-sm text-red-300">{attributes.error}</p>}</div>;
}
