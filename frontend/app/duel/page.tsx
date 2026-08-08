import { ConfidentialDuel } from "@/components/ConfidentialDuel";

export default function DuelPage() {
  return <main className="page-shell-narrow min-h-[calc(100vh-65px)]"><div className="mb-8 text-center"><p className="eyebrow">The challenge</p><h1 className="page-title mt-3">Sensei Duel</h1><p className="page-description mx-auto">A private test of technique.</p></div><ConfidentialDuel /></main>;
}
