import { DojoTraining } from "@/components/DojoTraining";

export default function DojoPage() {
  return (
    <main className="page-shell-narrow min-h-[calc(100vh-65px)]">
      <div className="mb-8 text-center">
        <p className="eyebrow">The dojo</p><h1 className="page-title mt-3">Sensei Training</h1>
        <p className="text-sm text-muted-foreground">The dojo strengthens what even the Sensei cannot see.</p>
      </div>
      <DojoTraining />
    </main>
  );
}
