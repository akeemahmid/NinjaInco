import { AwakeningCeremony } from "@/components/AwakeningCeremony";

export default function AwakeningPage() {
  return (
    <main className="page-shell-narrow min-h-[calc(100vh-65px)]">
      <div className="mb-8 text-center">
        <p className="eyebrow">The shrine</p><h1 className="page-title mt-3">Awakening Ceremony</h1>
        <p className="text-sm text-muted-foreground">Enter the shrine and discover the shape of your hidden potential.</p>
      </div>
      <AwakeningCeremony />
    </main>
  );
}
