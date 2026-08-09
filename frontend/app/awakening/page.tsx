import { AwakeningCeremony } from "@/components/AwakeningCeremony";
import { GameWorld } from "@/components/game/GameWorld";

export default function AwakeningPage() {
  return (
    <GameWorld eyebrow="The hidden shrine" title="Awakening Ceremony" description="Discover the shape of the potential sealed within you."><AwakeningCeremony /></GameWorld>
  );
}
