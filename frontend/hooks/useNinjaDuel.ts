"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from "wagmi";
import { type Address, type Hex } from "viem";
import { handleTypes } from "@inco/lightning-js";
import { getIncoLightning } from "@/lib/network";
import duelAbi from "@/abi/ninjaIncoDuel.json";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";
import { friendlyError } from "@/lib/errors";
import type { TransactionStage } from "@/components/TransactionStatus";

export const DUEL_TECHNIQUES = ["Shadow Blade", "Spirit Guard", "Phantom Step"] as const;
const DUEL_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_DUEL_ADDRESS as Address | undefined;
const getFeeAbi = [{ type: "function" as const, inputs: [], name: "getFee", outputs: [{ name: "", internalType: "uint256", type: "uint256" }], stateMutability: "pure" as const }];
let lightningInstance: any = null;
async function getLightning() { if (!lightningInstance) lightningInstance = await getIncoLightning(); return lightningInstance; }

export interface DuelResult { playerTechnique: number; senseiTechnique: number; outcome: 0 | 1 | 2; }
export type DuelLifecycle = "idle" | "submitting" | "confirming" | "refreshing-duel-id" | "ready-to-reveal" | "revealing" | "complete" | "error";

export function useNinjaDuel() {
  const { address, chainId } = useAccount();
  const registration = useNinjaRegistration();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [duelId, setDuelId] = useState<bigint | null>(null);
  const [result, setResult] = useState<DuelResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<DuelLifecycle>("idle");
  const sessionRef = useRef(0);
  const refreshedTxHashRef = useRef<Hex | undefined>(undefined);
  const { refetch: refetchLastDuelId } = useReadContract({ address: DUEL_ADDRESS, abi: duelAbi, functionName: "lastDuelId", args: address ? [address] : undefined, query: { enabled: !!DUEL_ADDRESS && !!address } });
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isSuccess: txConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirming) setLifecycle("confirming");
  }, [isConfirming]);

  useEffect(() => {
    if (!txConfirmed || !txHash || refreshedTxHashRef.current === txHash) return;
    refreshedTxHashRef.current = txHash;
    const session = sessionRef.current;

    void (async () => {
      setLifecycle("refreshing-duel-id");
      try {
        // The reveal ID is assigned only from this post-receipt read. Cached pre-duel data is never exposed.
        const refreshed = await refetchLastDuelId();
        if (session !== sessionRef.current) return;
        if (refreshed.error || refreshed.data === undefined) throw refreshed.error ?? new Error("Latest duel ID unavailable");
        setDuelId(refreshed.data as bigint);
        setLifecycle("ready-to-reveal");
      } catch (error) {
        if (session !== sessionRef.current) return;
        setDuelId(null);
        setLocalError(friendlyError(error));
        setLifecycle("error");
      }
    })();
  }, [txConfirmed, txHash, refetchLastDuelId]);

  useEffect(() => {
    if (!writeError) return;
    setLocalError(friendlyError(writeError));
    setLifecycle("error");
  }, [writeError]);

  useEffect(() => {
    // Duel handles and decrypted choices must never cross wallet or network boundaries.
    sessionRef.current += 1; refreshedTxHashRef.current = undefined; setDuelId(null); setResult(null); setIsEncrypting(false); setIsDecrypting(false); setLocalError(null); setLifecycle("idle"); resetWrite();
    return () => { sessionRef.current += 1; };
  }, [address, chainId, resetWrite]);

  const startDuel = useCallback(async (technique: number) => {
    if (!address || !DUEL_ADDRESS || !publicClient) return;
    if (lifecycle === "submitting" || lifecycle === "confirming" || lifecycle === "refreshing-duel-id" || lifecycle === "revealing") return;
    setLocalError(null); setResult(null); setDuelId(null); setLifecycle("submitting"); setIsEncrypting(true); const session = sessionRef.current;
    try {
      const lightning = await getLightning();
      const encryptedTechnique = await lightning.encrypt(BigInt(technique), { accountAddress: address, dappAddress: DUEL_ADDRESS, handleType: handleTypes.euint256 });
      const fee = await publicClient.readContract({ address: lightning.executorAddress, abi: getFeeAbi, functionName: "getFee" }) as bigint;
      if (session !== sessionRef.current) return; setIsEncrypting(false);
      writeContract({ address: DUEL_ADDRESS, abi: duelAbi, functionName: "duel", args: [encryptedTechnique], value: fee * BigInt(2) });
    } catch (error) { if (session !== sessionRef.current) return; setIsEncrypting(false); setLocalError(friendlyError(error)); setLifecycle("error"); }
  }, [address, publicClient, writeContract, lifecycle]);

  const revealDuel = useCallback(async () => {
    if (!address || !DUEL_ADDRESS || !publicClient || !walletClient || duelId === null || lifecycle !== "ready-to-reveal") return;
    setLocalError(null); setLifecycle("revealing"); setIsDecrypting(true); const session = sessionRef.current;
    try {
      const handles = await publicClient.readContract({ address: DUEL_ADDRESS, abi: duelAbi, functionName: "getMyDuel", args: [duelId], account: address }) as readonly Hex[];
      const decrypted = await (await getLightning()).attestedDecrypt(walletClient as any, [...handles]);
      const values = decrypted.map((item: any) => Number(item.plaintext.value));
      if (session === sessionRef.current) { setResult({ playerTechnique: values[0], senseiTechnique: values[1], outcome: values[2] as 0 | 1 | 2 }); setLifecycle("complete"); }
    } catch (error) { if (session === sessionRef.current) { setLocalError(friendlyError(error)); setLifecycle("error"); } }
    finally { if (session === sessionRef.current) setIsDecrypting(false); }
  }, [address, publicClient, walletClient, duelId, lifecycle]);

  const stage: TransactionStage = isEncrypting ? "Encrypting..." : lifecycle === "submitting" ? "Waiting for Wallet..." : lifecycle === "confirming" ? "Waiting for Confirmation..." : lifecycle === "refreshing-duel-id" ? "Confidential Computation..." : lifecycle === "ready-to-reveal" ? "Complete." : lifecycle === "revealing" ? "Decrypting..." : lifecycle === "complete" ? "Complete." : null;
  const canReveal = lifecycle === "ready-to-reveal" && duelId !== null;
  const busy = lifecycle === "submitting" || lifecycle === "confirming" || lifecycle === "refreshing-duel-id" || lifecycle === "revealing";
  return { address, isConfigured: !!DUEL_ADDRESS, isRegistered: registration.isRegistered, startDuel, revealDuel, duelId, result, lifecycle, canReveal, isEncrypting, isDecrypting, isPending, isConfirming, busy, stage, txConfirmed, error: localError, isLoading: registration.isLoading };
}
