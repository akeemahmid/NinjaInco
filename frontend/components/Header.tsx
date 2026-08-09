"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  ["Academy", "/"], ["Profile", "/profile"], ["Training", "/training"], ["Duel", "/duel"], ["Progression", "/progression"], ["Techniques", "/techniques"], ["Challenges", "/challenges"], ["Promotion", "/promotion"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 font-semibold" href="/" onClick={() => setOpen(false)}>
          <span className="grid h-7 w-7 place-items-center bg-foreground text-xs text-background">忍</span>NinjaInco
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-5 lg:flex">
          {links.map(([label, href]) => <Link className="text-xs text-muted-foreground hover:text-foreground" href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block"><WalletButton /></div>
          <button aria-expanded={open} aria-label="Toggle navigation" className="btn-secondary min-h-9 px-3 lg:hidden" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
        </div>
      </div>
      {open && <div className="border-t border-border/70 px-5 py-4 lg:hidden"><nav className="mx-auto grid max-w-6xl gap-1" aria-label="Mobile navigation">{links.map(([label, href]) => <Link className="px-3 py-3 text-sm hover:bg-card" href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}<div className="mt-3 sm:hidden"><WalletButton /></div></nav></div>}
    </header>
  );
}

function WalletButton() {
  return <ConnectButton.Custom>{({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
    const connected = mounted && account && chain;
    if (!connected) return <button className="btn-primary min-h-9 px-4 py-1.5" onClick={openConnectModal}>Connect</button>;
    if (chain.unsupported) return <button className="btn-secondary min-h-9 border-destructive px-4 py-1.5 text-destructive" onClick={openChainModal}>Switch network</button>;
    return <div className="flex gap-2"><button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={openChainModal}>{chain.name}</button><button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={openAccountModal}>{account.displayName}</button></div>;
  }}</ConnectButton.Custom>;
}
