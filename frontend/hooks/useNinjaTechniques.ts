"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import techniqueRegistryAbi from "@/abi/ninjaIncoTechniqueRegistry.json";

const TECHNIQUE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_TECHNIQUE_REGISTRY_ADDRESS as Address | undefined;
const techniqueAbi = techniqueRegistryAbi as any;
export interface NinjaTechnique { id: number; name: string; requiredRank: number; category: number; enabled: boolean; unlocked: boolean }

type TechniqueResult = readonly [number, string, number, number, boolean] | { id: number; name: string; requiredRank: number; category: number; enabled: boolean };
function normalizeTechnique(result: TechniqueResult) {
  if (Array.isArray(result)) {
    const [id, name, requiredRank, category, enabled] = result;
    return { id: Number(id), name, requiredRank: Number(requiredRank), category: Number(category), enabled };
  }
  const named = result as { id: number; name: string; requiredRank: number; category: number; enabled: boolean };
  return { id: Number(named.id), name: named.name, requiredRank: Number(named.requiredRank), category: Number(named.category), enabled: named.enabled };
}

export function useNinjaTechniques(playerRank: number | null, techniqueIds: readonly number[] = [0,1,2,3,4,5,6,7,8,9,10]) {
  const read = useReadContracts({ contracts: techniqueIds.map((id) => ({ address: TECHNIQUE_REGISTRY_ADDRESS, abi: techniqueAbi, functionName: "getTechnique" as const, args: [id] as const })), query: { enabled: !!TECHNIQUE_REGISTRY_ADDRESS } });
  const techniques = useMemo(() => (read.data ?? []).flatMap((item) => item.status === "success" ? [normalizeTechnique(item.result as TechniqueResult)] : []).map((technique) => ({ ...technique, unlocked: technique.enabled && playerRank !== null && playerRank >= technique.requiredRank })), [read.data, playerRank]);
  return { contractAddress: TECHNIQUE_REGISTRY_ADDRESS, isConfigured: !!TECHNIQUE_REGISTRY_ADDRESS, techniques, unlockedTechniques: techniques.filter((item) => item.unlocked), isLoading: read.isLoading, error: read.error ? friendlyError(read.error) : null, refetch: read.refetch };
}

import { friendlyError } from "@/lib/errors";
