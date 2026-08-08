"use client";

import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useNinjaRegistration, VILLAGES } from "@/hooks/useNinjaRegistration";
import { useNinjaAttributes } from "@/hooks/useNinjaAttributes";
import { useNinjaPromotion } from "@/hooks/useNinjaPromotion";

const actions = [
  { title: "Awakening", description: "Discover your hidden potential.", href: "/awakening" },
  { title: "Training", description: "Strengthen your weakest hidden attribute.", href: "/dojo" },
  { title: "Duel", description: "Test a confidential technique against the Sensei.", href: "/duel" },
  { title: "Promotion", description: "Let the council evaluate your progress privately.", href: "/promotion" },
];

export function AcademyDashboard() {
  const { openConnectModal } = useConnectModal();
  const { address, isConfigured, isRegistered, profile, isLoading } = useNinjaRegistration();
  const attributes = useNinjaAttributes();
  const promotion = useNinjaPromotion();

  if (!isConfigured) {
    return <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_NINJAINCO_ADDRESS to enter the Academy.</p>;
  }

  if (!address) {
    return (
      <button className="border border-border px-4 py-2 text-sm hover:border-foreground/40" onClick={openConnectModal}>
        connect wallet to enter the Academy
      </button>
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground animate-pulse">loading academy profile...</p>;

  if (!isRegistered || !profile) {
    return (
      <div className="space-y-3 border border-border p-5">
        <p className="text-sm">Register a ninja before entering the Academy.</p>
        <Link className="inline-block border border-border px-4 py-2 text-sm hover:border-foreground/40" href="/register">
          create ninja →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="surface bg-gradient-to-br from-card/90 to-background p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">academy member</p>
            <h2 className="text-2xl font-medium">{profile.displayName}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{VILLAGES[profile.village] ?? "Unknown"} village</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm sm:text-right">
            <div><p className="text-xs text-muted-foreground">rank</p><p className="mt-1 font-medium">{promotion.rank === 1 ? "Genin" : "Initiate"}</p></div>
            <div><p className="text-xs text-muted-foreground">promotion progress</p><p className="mt-1 font-medium">{promotion.rank === 1 ? "Complete" : attributes.hasAttributes ? "Training Complete" : "Awakening Required"}</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          (
            <Link className="surface surface-hover group p-5" href={action.href} key={action.title}>
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-base">{action.title}</h3><p className="mt-2 text-xs text-muted-foreground">{action.description}</p></div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">open →</span>
              </div>
            </Link>
          )
        ))}
      </section>
    </div>
  );
}
