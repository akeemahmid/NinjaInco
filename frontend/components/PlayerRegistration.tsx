"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { TECHNIQUES, useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { TransactionStatus } from "./TransactionStatus";

export function PlayerRegistration() {
  const [displayName, setDisplayName] = useState("");
  const [village, setVillage] = useState(0);
  const [technique, setTechnique] = useState(0);
  const { openConnectModal } = useConnectModal();
  const { address: sessionAddress, chainId } = useAccount();
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
      <div className="space-y-3 border border-border p-5">
        <p className="text-sm">Your ninja is registered.</p>
        <Link className="text-sm underline" href="/profile">view player profile →</Link>
      </div>
    );
  }

  return (
    <form className="surface space-y-6 p-6 sm:p-8" onSubmit={submit}>
      <label className="block space-y-2 text-sm">
        <span>display name</span>
        <input
          className="field"
          maxLength={32}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          value={displayName}
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span>village (public)</span>
        <select className="field" onChange={(event) => setVillage(Number(event.target.value))} value={village}>
          {VILLAGES.map((name, index) => <option key={name} value={index}>{name}</option>)}
        </select>
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="mb-2">starting technique (confidential)</legend>
        {TECHNIQUES.map((name, index) => (
          <label className="flex items-center gap-2" key={name}>
            <input checked={technique === index} name="technique" onChange={() => setTechnique(index)} type="radio" />
            <span>{name}</span>
          </label>
        ))}
      </fieldset>

      <button className="btn-primary w-full" disabled={busy || !displayName.trim()} type="submit">
        {isEncrypting ? "encrypting technique..." : isWritePending ? "registering..." : "create ninja"}
      </button>

      <TransactionStatus stage={stage} />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </form>
  );
}
