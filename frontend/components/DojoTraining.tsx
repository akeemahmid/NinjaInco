"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";
import { useNinjaAttributes } from "@/hooks/useNinjaAttributes";
import { TransactionStatus } from "./TransactionStatus";

const TRAINING_STEPS = [
  "Observing your stance...",
  "Finding the hidden weakness...",
  "Focusing your chakra...",
  "Strengthening your foundation...",
] as const;

export function DojoTraining() {
  const { openConnectModal } = useConnectModal();
  const registration = useNinjaRegistration();
  const attributes = useNinjaAttributes();
  const { address, chainId } = useAccount();
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Training animation and transaction state are scoped to the connected wallet/chain.
    setTrainingStarted(false); setAnimationComplete(false); setStep(0);
  }, [address, chainId]);

  useEffect(() => {
    if (!trainingStarted) return;
    const stepTimer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, TRAINING_STEPS.length - 1));
    }, 700);
    const completionTimer = window.setTimeout(() => setAnimationComplete(true), 2800);
    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(completionTimer);
    };
  }, [trainingStarted]);

  const beginTraining = () => {
    setStep(0);
    setAnimationComplete(false);
    setTrainingStarted(true);
    attributes.train();
  };

  if (!registration.address) {
    return <button className="border border-border px-4 py-2 text-sm" onClick={openConnectModal}>connect wallet to enter the dojo</button>;
  }
  if (!registration.isConfigured || !attributes.isConfigured) {
    return <p className="text-sm text-muted-foreground">Configure the registry and attributes contract addresses to enter the dojo.</p>;
  }
  if (registration.isLoading || attributes.isLoading) {
    return <p className="animate-pulse text-sm text-muted-foreground">the Sensei is preparing the dojo...</p>;
  }
  if (!registration.isRegistered) {
    return <p className="text-sm">The dojo accepts registered ninjas only. <Link className="underline" href="/register">Register →</Link></p>;
  }
  if (!attributes.hasAttributes) {
    return <p className="text-sm">You must complete your awakening first. <Link className="underline" href="/awakening">Enter the shrine →</Link></p>;
  }
  if (trainingStarted && attributes.txConfirmed && animationComplete) {
    return (
      <section className="dojo-panel p-8 text-center md:p-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">lesson complete</p>
        <h2 className="mt-5 text-2xl font-medium">Training Complete.</h2>
        <p className="mt-3 text-sm text-muted-foreground">You feel stronger.</p>
        <Link className="mt-8 inline-block border border-border px-5 py-2.5 text-sm hover:border-foreground/40" href="/academy">Return to Academy →</Link>
      </section>
    );
  }
  if (trainingStarted) {
    return (
      <section className="dojo-panel flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-8 h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full border border-foreground/20" />
          <div className="absolute inset-4 animate-pulse rounded-full bg-foreground/10" />
          <div className="absolute inset-8 rounded-full bg-foreground/30" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">confidential training</p>
        <p className="mt-4 text-lg">{TRAINING_STEPS[step]}</p>
        <p className="mt-5 max-w-sm text-xs leading-5 text-muted-foreground">The Sensei compares your encrypted attributes without seeing their values.</p>
        <div className="mt-5 w-full max-w-sm"><TransactionStatus stage={attributes.stage}/></div>
        {attributes.error && <p className="mt-4 text-xs text-destructive">{attributes.error}</p>}
      </section>
    );
  }

  return (
    <section className="dojo-panel p-6 md:p-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-border bg-background text-3xl">師</div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Academy Sensei</p>
          <blockquote className="mt-4 text-lg leading-7">“Every ninja has a weakness.<br />Allow me to strengthen yours.”</blockquote>
        </div>
      </div>
      <button className="btn-primary mt-8 w-full" disabled={attributes.busy} onClick={beginTraining}>
        Train
      </button>
    </section>
  );
}
