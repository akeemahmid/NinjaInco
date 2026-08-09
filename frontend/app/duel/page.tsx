import { ConfidentialDuel } from "@/components/ConfidentialDuel";
import { JourneyNav } from "@/components/game/GameWorld";

export default function DuelPage() {
  return <main className="dojo-world min-h-[calc(100vh-65px)] overflow-hidden"><div className="dojo-fog" aria-hidden="true"/><div className="dojo-embers" aria-hidden="true"/><div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"><JourneyNav currentPath="/duel"/><ConfidentialDuel /></div></main>;
}
