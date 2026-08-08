import Link from "next/link";

const features = [
  ["Private identity", "Choose a secret technique that is encrypted before it ever leaves your browser."],
  ["Hidden progression", "Train attributes and earn experience without publishing the underlying values."],
  ["Verifiable outcomes", "Inco computes over encrypted game state and returns attested results you can trust."],
];
const journey = [["01", "Register", "Create your public ninja identity."], ["02", "Awaken", "Generate wallet-bound hidden attributes."], ["03", "Train", "Strengthen your weakest attribute privately."], ["04", "Duel", "Face the Sensei with encrypted techniques."], ["05", "Promotion", "Prove eligibility without exposing experience."]];

export default function Home() {
  return <main>
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,hsl(var(--foreground)/0.11),transparent_32%),radial-gradient(circle_at_15%_80%,hsl(var(--foreground)/0.06),transparent_35%)]" />
      <div className="page-shell relative grid min-h-[70vh] items-center gap-12 py-20 lg:grid-cols-[1.15fr_.85fr] lg:py-28">
        <div><p className="eyebrow">Confidential on-chain adventure</p><h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl lg:text-7xl">Become the ninja nobody can read.</h1><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Build your identity, awaken hidden attributes, and challenge the Sensei in a game powered by Inco confidential computation.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link className="btn-primary" href="/register">Begin your journey →</Link><Link className="btn-secondary" href="/technology">How privacy works</Link></div></div>
        <div className="surface relative mx-auto aspect-square w-full max-w-md overflow-hidden p-8"><div className="absolute inset-8 rounded-full border border-foreground/10"/><div className="absolute inset-16 animate-pulse rounded-full border border-foreground/20"/><div className="grid h-full place-items-center"><div className="grid h-36 w-36 place-items-center rounded-full bg-foreground text-6xl text-background shadow-2xl">忍</div></div><p className="absolute bottom-6 left-0 right-0 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">Your secrets remain yours</p></div>
      </div>
    </section>
    <section className="page-shell"><p className="eyebrow">The game</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">A progression game built around privacy.</h2><div className="mt-10 grid gap-4 md:grid-cols-3">{features.map(([title, copy]) => <article className="surface surface-hover p-6 sm:p-7" key={title}><div className="mb-8 h-10 w-10 border border-foreground/20 bg-foreground/5"/><h3 className="text-lg font-medium">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}</div></section>
    <section className="border-y border-border/70 bg-card/35"><div className="page-shell"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">Your path</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">From Initiate to Genin.</h2><p className="page-description">Every step combines familiar wallet interactions with confidential computation behind the scenes.</p></div><div className="grid gap-3">{journey.map(([number,title,copy], i) => <div className="surface flex gap-5 p-5" key={title}><span className="text-xs text-muted-foreground">{number}</span><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{copy}</p></div>{i < journey.length-1 && <span className="ml-auto text-muted-foreground">↓</span>}</div>)}</div></div></div></section>
    <section className="page-shell text-center"><p className="eyebrow">Enter the Academy</p><h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold sm:text-5xl">Your ninja story starts with one encrypted choice.</h2><div className="mt-8"><Link className="btn-primary" href="/register">Create your ninja →</Link></div></section>
  </main>;
}
