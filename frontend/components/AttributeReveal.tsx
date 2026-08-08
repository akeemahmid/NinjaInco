"use client";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { type RevealedAttributes, useNinjaAttributes } from "@/hooks/useNinjaAttributes";
import { TransactionStatus } from "./TransactionStatus";
const STYLES = ["Shadow", "Spirit", "Phantom"] as const;
function level(value: number) { return value < 40 ? { label: "Low", segments: 1 } : value < 70 ? { label: "Medium", segments: 2 } : { label: "High", segments: 3 }; }
function Bar({ label, value }: { label: string; value: number }) { const item = level(value); return <div className="space-y-2"><div className="flex justify-between text-sm"><span>{label}</span><span className="text-xs text-muted-foreground">{item.label}</span></div><div className="grid grid-cols-3 gap-2">{[1,2,3].map((n) => <div className={`h-2 border border-border ${n <= item.segments ? "bg-foreground" : "bg-muted"}`} key={n} />)}</div></div>; }
function Revealed({ attributes }: { attributes: RevealedAttributes }) { return <div className="space-y-5 border border-border bg-card/40 p-5"><Bar label="Power" value={attributes.power}/><Bar label="Speed" value={attributes.speed}/><Bar label="Focus" value={attributes.focus}/><Bar label="Luck" value={attributes.luck}/><Bar label="Chakra" value={attributes.chakra}/><div className="flex justify-between border-t border-border pt-4 text-sm"><span>Starting Style</span><span className="text-muted-foreground">{STYLES[attributes.startingStyle] ?? "Unknown"}</span></div><p className="text-xs text-muted-foreground">Exact numeric values remain hidden in the interface.</p></div>; }
export function AttributeReveal() {
  const { openConnectModal } = useConnectModal(); const registration = useNinjaRegistration(); const attributes = useNinjaAttributes();
  if (!registration.address) return <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>connect wallet to view attributes</button>;
  if (!registration.isConfigured || !attributes.isConfigured) return <p className="text-sm text-muted-foreground">Configure the registry and attributes contract addresses to continue.</p>;
  if (registration.isLoading || attributes.isLoading) return <p className="animate-pulse text-sm text-muted-foreground">loading confidential character...</p>;
  if (!registration.isRegistered) return <p className="text-sm">Create a ninja first. <Link className="underline" href="/register">Register →</Link></p>;
  if (!attributes.hasAttributes) return <div className="surface space-y-4 p-6"><p className="text-sm">Generate confidential attributes for this registered ninja.</p><button className="btn-primary" disabled={attributes.busy} onClick={attributes.initializeAttributes}>Initialize confidential attributes</button><TransactionStatus stage={attributes.stage}/>{attributes.error && <p role="alert" className="text-sm text-destructive">{attributes.error}</p>}</div>;
  return <div className="space-y-5">{attributes.revealedAttributes ? <Revealed attributes={attributes.revealedAttributes}/> : <div className="surface space-y-4 p-6"><p className="text-sm">Your attributes are stored as wallet-authorized Inco handles.</p><button className="btn-primary" disabled={attributes.busy} onClick={attributes.revealMyAttributes}>Reveal my attributes</button><TransactionStatus stage={attributes.stage}/></div>}{attributes.error && <p role="alert" className="text-sm text-destructive">{attributes.error}</p>}</div>;
}
