import { PlayerRegistration } from "@/components/PlayerRegistration";

export default function RegisterPage() {
  return (
    <main className="page-shell-narrow min-h-[calc(100vh-65px)]">
      <p className="eyebrow">Registration</p><h1 className="page-title mt-3">Create your ninja</h1>
      <p className="page-description mb-8">Your name and village are public. Your starting technique is encrypted with Inco.</p>
      <PlayerRegistration />
    </main>
  );
}
