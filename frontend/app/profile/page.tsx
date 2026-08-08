import { PlayerProfile } from "@/components/PlayerProfile";

export default function ProfilePage() {
  return (
    <main className="page-shell-narrow min-h-[calc(100vh-65px)]">
      <p className="eyebrow">Identity</p><h1 className="page-title mt-3">Player profile</h1>
      <p className="page-description mb-8">Public identity with a wallet-authorized confidential technique.</p>
      <PlayerProfile />
    </main>
  );
}
