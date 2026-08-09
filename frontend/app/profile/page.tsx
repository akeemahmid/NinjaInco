import { PlayerProfile } from "@/components/PlayerProfile";
import { GameWorld } from "@/components/game/GameWorld";

export default function ProfilePage() {
  return (
    <GameWorld eyebrow="Ninja record" title="Your profile" description="The identity known to the villages, and the secret known only to you."><PlayerProfile /></GameWorld>
  );
}
