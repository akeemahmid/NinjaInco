"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { friendlyError } from "@/lib/errors";
import challengeRegistryAbi from "@/abi/ninjaIncoChallengeRegistry.json";

const CHALLENGE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_CHALLENGE_REGISTRY_ADDRESS as Address | undefined;
const challengeAbi = challengeRegistryAbi as any;
export interface NinjaChallenge { id: bigint; name: string; requiredRank: number; opponentTier: number; techniquePoolId: bigint; difficulty: number; enabled: boolean; canEnter: boolean }

type ChallengeResult = readonly [bigint, string, number, number, bigint, number, boolean] | { id: bigint; name: string; requiredRank: number; opponentTier: number; techniquePoolId: bigint; difficulty: number; enabled: boolean };
function normalizeChallenge(result: ChallengeResult) {
  if (Array.isArray(result)) {
    const [id, name, requiredRank, opponentTier, techniquePoolId, difficulty, enabled] = result;
    return { id, name, requiredRank: Number(requiredRank), opponentTier: Number(opponentTier), techniquePoolId, difficulty: Number(difficulty), enabled };
  }
  const named = result as { id: bigint; name: string; requiredRank: number; opponentTier: number; techniquePoolId: bigint; difficulty: number; enabled: boolean };
  return { id: named.id, name: named.name, requiredRank: Number(named.requiredRank), opponentTier: Number(named.opponentTier), techniquePoolId: named.techniquePoolId, difficulty: Number(named.difficulty), enabled: named.enabled };
}

export function useNinjaChallenges(playerRank: number | null, challengeIds: readonly bigint[] = [BigInt(0),BigInt(1),BigInt(2)]) {
  const read = useReadContracts({ contracts: challengeIds.map((id) => ({ address: CHALLENGE_REGISTRY_ADDRESS, abi: challengeAbi, functionName: "getChallenge" as const, args: [id] as const })), query: { enabled: !!CHALLENGE_REGISTRY_ADDRESS } });
  const challenges = useMemo(() => (read.data ?? []).flatMap((item) => item.status === "success" ? [normalizeChallenge(item.result as ChallengeResult)] : []).map((challenge) => ({ ...challenge, canEnter: challenge.enabled && playerRank !== null && playerRank >= challenge.requiredRank })), [read.data, playerRank]);
  return { contractAddress: CHALLENGE_REGISTRY_ADDRESS, isConfigured: !!CHALLENGE_REGISTRY_ADDRESS, challenges, enterableChallenges: challenges.filter((item) => item.canEnter), isLoading: read.isLoading, error: read.error ? friendlyError(read.error) : null, refetch: read.refetch };
}
