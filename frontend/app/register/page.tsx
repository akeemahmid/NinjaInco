import { PlayerRegistration } from "@/components/PlayerRegistration";
import { GameWorld } from "@/components/game/GameWorld";

export default function RegisterPage() {
  return (
    <GameWorld eyebrow="The first oath" title="Create your ninja identity" description="Choose the name the villages will know—and the technique only you may reveal."><PlayerRegistration /></GameWorld>
  );
}
