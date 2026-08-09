import { DojoTraining } from "@/components/DojoTraining";
import { GameWorld } from "@/components/game/GameWorld";

export default function DojoPage() {
  return (
    <GameWorld eyebrow="The moonlit dojo" title="Sensei Training" description="Strengthen the weakness that remains hidden from every observer."><DojoTraining /></GameWorld>
  );
}
