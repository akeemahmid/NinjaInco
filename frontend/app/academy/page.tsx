import { AcademyDashboard } from "@/components/AcademyDashboard";

export default function AcademyPage() {
  return (
    <main className="page-shell min-h-[calc(100vh-65px)]">
      <div className="mb-8 md:mb-12">
        <p className="eyebrow">Dashboard</p><h1 className="page-title mt-3">Ninja Academy</h1>
        <p className="page-description">Your path begins here.</p>
      </div>
      <AcademyDashboard />
    </main>
  );
}
