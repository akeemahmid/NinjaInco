"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";
import type { Address, Hex } from "viem";
import { getIncoLightning } from "@/lib/network";
import { friendlyError } from "@/lib/errors";
import progressionRegistryAbi from "@/abi/ninjaIncoProgressionV2.json";

const PROGRESSION_V2_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_PROGRESSION_V2_ADDRESS as Address | undefined;
const progressionV2Abi = progressionRegistryAbi as any;

export interface NinjaProgressV2 { challengeWins: bigint; trainingCount: bigint }

export function useNinjaProgressionV2() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [progress, setProgress] = useState<NinjaProgressV2 | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const sessionRef = useRef(0);
  const rankRead = useReadContract({ address: PROGRESSION_V2_ADDRESS, abi: progressionV2Abi, functionName: "rankOf", args: address ? [address] : undefined, query: { enabled: !!PROGRESSION_V2_ADDRESS && !!address } });

  useEffect(() => { sessionRef.current += 1; setProgress(null); setIsDecrypting(false); setLocalError(null); return () => { sessionRef.current += 1; }; }, [address, chainId]);

  const readConfidentialProgress = useCallback(async () => {
    if (!address || !PROGRESSION_V2_ADDRESS || !publicClient || !walletClient) return;
    const session = sessionRef.current; setLocalError(null); setIsDecrypting(true);
    try {
      const handles = await publicClient.readContract({ address: PROGRESSION_V2_ADDRESS, abi: progressionV2Abi as any, functionName: "getMyConfidentialProgress", account: address }) as unknown as readonly Hex[];
      const values = await (await getIncoLightning()).attestedDecrypt(walletClient as any, [...handles]);
      if (session === sessionRef.current) setProgress({ challengeWins: BigInt(values[0].plaintext.value), trainingCount: BigInt(values[1].plaintext.value) });
    } catch (error) { if (session === sessionRef.current) setLocalError(friendlyError(error)); }
    finally { if (session === sessionRef.current) setIsDecrypting(false); }
  }, [address, publicClient, walletClient]);

  return { address, contractAddress: PROGRESSION_V2_ADDRESS, isConfigured: !!PROGRESSION_V2_ADDRESS, rank: rankRead.data === undefined ? null : Number(rankRead.data), progress, readConfidentialProgress, isDecrypting, isLoading: rankRead.isLoading, error: localError || (rankRead.error ? friendlyError(rankRead.error) : null), refetchRank: rankRead.refetch };
}
