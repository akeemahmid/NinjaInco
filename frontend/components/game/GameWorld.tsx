"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const journey = [["Identity", "/register"], ["Awakening", "/awakening"], ["Training", "/dojo"], ["Duel", "/duel"], ["Promotion", "/promotion"]] as const;
export function JourneyNav({ currentPath }: { currentPath?: string }) { const pathname = usePathname(); const activePath = currentPath ?? pathname; return <nav aria-label="Ninja journey" className="journey-nav">{journey.map(([label, href], index) => <Link aria-current={activePath === href ? "page" : undefined} className={activePath === href ? "current" : ""} href={href} key={href}><span>{String(index + 1).padStart(2, "0")}</span>{label}</Link>)}</nav>; }

export function GameWorld({ eyebrow, title, description, children, wide = false }: { eyebrow: string; title: string; description: string; children: ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  return <main className="game-world min-h-[calc(100vh-65px)] overflow-hidden"><div className="dojo-fog" aria-hidden="true"/><div className="dojo-embers" aria-hidden="true"/><div className={`relative mx-auto w-full ${wide ? "max-w-6xl" : "max-w-4xl"} px-4 py-8 sm:px-6 sm:py-12 lg:px-8`}><JourneyNav currentPath={pathname}/><header className="game-page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>{children}</div></main>;
}
