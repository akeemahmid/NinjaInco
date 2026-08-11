import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Built for the Inco Hackathon</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          {/* <span className="text-muted-foreground/70">GitHub (repository URL pending)</span> */}
          <Link className="hover:text-foreground" href="/technology">Documentation</Link>
          <Link className="hover:text-foreground" href="/technology">Technology</Link>
        </nav>
      </div>
    </footer>
  );
}
