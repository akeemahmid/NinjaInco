"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { TECHNIQUES, useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { TransactionStatus } from "./TransactionStatus";

export function PlayerRegistration() {
  const [displayName, setDisplayName] = useState("");
  const [village, setVillage] = useState(0);
  const [technique, setTechnique] = useState(0);
  const { openConnectModal } = useConnectModal();
  const { address: sessionAddress, chainId } = useAccount();
  const router = useRouter();
  const {
    address,
    isConfigured,
    isRegistered,
    registerPlayer,
    isEncrypting, isWritePending, busy, stage,
    txConfirmed,
    error,
  } = useNinjaRegistration();

  useEffect(() => {
    // The receipt only proves the transaction mined; wait for the authoritative
    // registration read to turn true before entering the Academy.
    if (isRegistered) router.replace("/");
  }, [isRegistered, router]);

  useEffect(() => {
    // Do not carry registration input, including the confidential technique choice, across sessions.
    setDisplayName(""); setVillage(0); setTechnique(0);
  }, [sessionAddress, chainId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    registerPlayer({ displayName, village, technique });
  };

  if (!isConfigured) {
    return <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_NINJAINCO_ADDRESS to enable registration.</p>;
  }

  if (!address) {
    return (
      <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>
        connect wallet to create a ninja
      </button>
    );
  }

  if (isRegistered || txConfirmed) {
    return (
      <div className="dojo-panel space-y-5 p-8 text-center"><div className="ninja-seal"><span>忍</span></div>
        <p className="text-xl">Your identity has been recorded.</p>
        <Link className="btn-primary" href="/profile">View ninja profile →</Link>
      </div>
    );
  }

  return (
    <form className="dojo-panel space-y-8 p-6 sm:p-9" onSubmit={submit}>
      <label className="block space-y-2 text-sm">
        <span className="eyebrow">Name known to the villages</span>
        <input
          className="field"
          maxLength={32}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          value={displayName}
        />
      </label>

      <fieldset><legend className="eyebrow mb-3">Choose your village · public</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{VILLAGES.map((name,index)=><button className={`game-choice ${village===index ? "selected" : ""}`} key={name} onClick={()=>setVillage(index)} type="button">{name}</button>)}</div></fieldset>

      <fieldset className="space-y-2 text-sm">
        <legend className="eyebrow mb-3">Starting technique · confidential</legend>
        <div className="grid gap-2 sm:grid-cols-3">
        {TECHNIQUES.map((name, index) => (
          <label className={`game-choice min-h-24 cursor-pointer text-left ${technique === index ? "selected" : ""}`} key={name}><input className="sr-only" checked={technique === index} name="technique" onChange={() => setTechnique(index)} type="radio" /><span className="block text-lg">{["✦","◇","◌"][index]}</span><span className="mt-3 block">{name}</span></label>
        ))}
        </div>
      </fieldset>

      <button className="btn-primary w-full" disabled={busy || !displayName.trim()} type="submit">
        {isEncrypting ? "Sealing your technique..." : isWritePending ? "Awaiting authorization..." : "Create ninja identity"}
      </button>

      <TransactionStatus stage={stage} />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </form>
  );
}
