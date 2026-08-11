"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { activeChain } from "@/lib/network";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";

const REGISTRATION_ROUTE = "/register";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { address, chainId } = useAccount();
  const registration = useNinjaRegistration();
  const configured = registration.isConfigured;
  const supportedNetwork = !address || chainId === activeChain.id;

  useEffect(() => {
    if (!address || !configured || !supportedNetwork || registration.isLoading) return;

    if (!registration.isRegistered && pathname !== REGISTRATION_ROUTE) {
      router.replace(REGISTRATION_ROUTE);
    } else if (registration.isRegistered && pathname === REGISTRATION_ROUTE) {
      router.replace("/");
    }
  }, [address, configured, supportedNetwork, registration.isLoading, registration.isRegistered, pathname, router]);

  return <>{children}</>;
}
