import { AcademyDashboard } from "@/components/AcademyDashboard";
import { GameWorld } from "@/components/game/GameWorld";

export default function AcademyPage() {
  return (
    <GameWorld wide eyebrow="Headquarters" title="Ninja Academy" description="Your identity, training, and next mission converge here."><AcademyDashboard /></GameWorld>
  );
}
