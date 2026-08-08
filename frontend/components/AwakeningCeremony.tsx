"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";
import { type RevealedAttributes, useNinjaAttributes } from "@/hooks/useNinjaAttributes";
import { TransactionStatus } from "./TransactionStatus";

const CEREMONY_STEPS = [
  "Scanning Spirit...",
  "Reading Chakra...",
  "Evaluating Potential...",
  "Determining Hidden Affinity...",
] as const;

const STYLES = ["Shadow", "Spirit", "Phantom"] as const;

function qualitativeLevel(value: number) {
  if (value < 40) return { label: "Low", segments: 1 };
  if (value < 70) return { label: "Medium", segments: 2 };
  return { label: "High", segments: 3 };
}

function AttributeBar({ label, value }: { label: string; value: number }) {
  const level = qualitativeLevel(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">{level.label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((segment) => (
          <div
            className={`h-2 border border-border transition-colors duration-500 ${segment <= level.segments ? "bg-foreground" : "bg-muted"}`}
            key={segment}
          />
        ))}
      </div>
    </div>
  );
}

function AwakeningResults({ attributes }: { attributes: RevealedAttributes }) {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">awakening complete</p>
        <h2 className="text-2xl font-medium">Your spirit has answered.</h2>
        <p className="mt-2 text-sm text-muted-foreground">The shrine reveals only the shape of your potential.</p>
      </div>

      <div className="space-y-5 border border-border bg-card/40 p-5 md:p-6">
        <AttributeBar label="Power" value={attributes.power} />
        <AttributeBar label="Speed" value={attributes.speed} />
        <AttributeBar label="Focus" value={attributes.focus} />
        <AttributeBar label="Luck" value={attributes.luck} />
        <AttributeBar label="Chakra" value={attributes.chakra} />
        <div className="flex items-center justify-between border-t border-border pt-5 text-sm">
          <span>Starting Style</span>
          <span className="font-medium">{STYLES[attributes.startingStyle] ?? "Unknown"}</span>
        </div>
      </div>

      <Link className="block w-full bg-foreground px-4 py-3 text-center text-sm font-medium text-background" href="/academy">
        Continue to Academy →
      </Link>
    </section>
  );
}

export function AwakeningCeremony() {
  const { openConnectModal } = useConnectModal();
  const registration = useNinjaRegistration();
  const attributes = useNinjaAttributes();
  const { address, chainId } = useAccount();
  const [ceremonyStarted, setCeremonyStarted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Ceremony progress must not carry confidential results into another wallet session.
    setCeremonyStarted(false); setStep(0);
  }, [address, chainId]);

  useEffect(() => {
    if (!ceremonyStarted || attributes.revealedAttributes) return;
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, CEREMONY_STEPS.length - 1));
    }, 1200);
    return () => window.clearInterval(timer);
  }, [ceremonyStarted, attributes.revealedAttributes]);

  useEffect(() => {
    if (!ceremonyStarted || !attributes.hasAttributes || attributes.revealedAttributes || attributes.isDecrypting) return;
    attributes.revealMyAttributes();
  }, [ceremonyStarted, attributes.hasAttributes, attributes.revealedAttributes, attributes.isDecrypting, attributes.revealMyAttributes]);

  const beginAwakening = () => {
    setStep(0);
    setCeremonyStarted(true);
    if (attributes.hasAttributes) {
      attributes.revealMyAttributes();
    } else {
      attributes.initializeAttributes();
    }
  };

  if (!registration.address) {
    return <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>connect wallet to enter the shrine</button>;
  }
  if (!registration.isConfigured || !attributes.isConfigured) {
    return <p className="text-sm text-muted-foreground">Configure the registry and attributes contract addresses to enter the shrine.</p>;
  }
  if (registration.isLoading || attributes.isLoading) {
    return <p className="animate-pulse text-sm text-muted-foreground">the shrine is reading your presence...</p>;
  }
  if (!registration.isRegistered) {
    return <p className="text-sm">Only registered ninjas may awaken. <Link className="underline" href="/register">Create your ninja →</Link></p>;
  }
  if (attributes.revealedAttributes) {
    return <AwakeningResults attributes={attributes.revealedAttributes} />;
  }
  if (ceremonyStarted) {
    return (
      <section className="flex min-h-[360px] flex-col items-center justify-center border border-border bg-card/30 px-6 py-12 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-foreground/30">
          <div className="h-10 w-10 animate-pulse rounded-full bg-foreground/15" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ceremony in progress</p>
        <p className="mt-4 text-lg">{CEREMONY_STEPS[step]}</p>
        <div className="mt-8 flex gap-2">
          {CEREMONY_STEPS.map((item, index) => (
            <span className={`h-1.5 w-8 transition-colors duration-500 ${index <= step ? "bg-foreground" : "bg-muted"}`} key={item} />
          ))}
        </div>
        <div className="mt-6 w-full max-w-sm"><TransactionStatus stage={attributes.stage}/></div>
        {attributes.error && <p className="mt-4 text-xs text-destructive">{attributes.error}</p>}
      </section>
    );
  }

  return (
    <section className="border border-border bg-card/30 p-6 text-center md:p-10">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">the ancient shrine</p>
      <h2 className="mt-5 text-2xl font-medium">The stone remembers every ninja.</h2>
      <div className="mx-auto mt-5 max-w-lg space-y-3 text-sm leading-6 text-muted-foreground">
        <p>Beyond the Academy stands a shrine older than the four villages.</p>
        <p>Place your hand upon its seal. Your hidden potential will be encrypted, bound to your wallet, and revealed only to you.</p>
      </div>
      <button className="btn-primary mt-8" disabled={attributes.busy} onClick={beginAwakening}>
        Begin Awakening
      </button>
    </section>
  );
}
