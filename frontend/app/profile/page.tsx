import { PlayerProfile } from "@/components/PlayerProfile";

export default function ProfilePage() {
  return (
    <main className="academy-hub min-h-[calc(100vh-65px)]"><div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8"><header className="mb-8"><p className="eyebrow text-violet-200/70">Ninja archive</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Shinobi Profile</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">Your public identity and V2 rank, guarded beside wallet-authorized confidential abilities and your sealed technique.</p></header><PlayerProfile /></div></main>
  );
}
