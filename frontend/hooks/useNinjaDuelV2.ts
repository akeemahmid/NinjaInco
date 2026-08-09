"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from "wagmi";
import type { Address, Hex } from "viem";
import { handleTypes } from "@inco/lightning-js";
import { getIncoLightning } from "@/lib/network";
import { friendlyError } from "@/lib/errors";
import duelV2Abi from "@/abi/ninjaIncoDuelV2.json";

const DUEL_V2_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_DUEL_V2_ADDRESS as Address | undefined;
const abi = duelV2Abi as any;
const feeAbi = [{ type: "function", name: "getFee", stateMutability: "pure", inputs: [], outputs: [{ type: "uint256" }] }] as const;

export interface NinjaDuelV2Result {
  challengeId: bigint;
  playerTechnique: bigint;
  opponentTechnique: bigint;
  outcome: bigint;
  settled: boolean;
}

export function useNinjaDuelV2() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const duelWrite = useWriteContract();
  const settleWrite = useWriteContract();
  const duelReceipt = useWaitForTransactionReceipt({ hash: duelWrite.data });
  const settleReceipt = useWaitForTransactionReceipt({ hash: settleWrite.data });
  const [duelId, setDuelId] = useState<bigint | null>(null);
  const [result, setResult] = useState<NinjaDuelV2Result | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => { setDuelId(null); setResult(null); setLocalError(null); }, [address]);

  const play = useCallback(async (challengeId: bigint, technique: number) => {
    if (!address || !DUEL_V2_ADDRESS || !publicClient) return;
    settleWrite.reset(); setDuelId(null); setIsEncrypting(true); setLocalError(null); setResult(null);
    try {
      const lightning = await getIncoLightning();
      const encrypted = await lightning.encrypt(BigInt(technique), { accountAddress: address, dappAddress: DUEL_V2_ADDRESS, handleType: handleTypes.euint256 });
      const fee = await publicClient.readContract({ address: lightning.executorAddress, abi: feeAbi, functionName: "getFee" }) as bigint;
      duelWrite.writeContract({ address: DUEL_V2_ADDRESS, abi, functionName: "duel", args: [challengeId, encrypted], value: fee * BigInt(512) });
    } catch (error) { setLocalError(friendlyError(error)); }
    finally { setIsEncrypting(false); }
  }, [address, publicClient, duelWrite, settleWrite]);

  useEffect(() => {
    if (!duelReceipt.isSuccess || !address || !DUEL_V2_ADDRESS || !publicClient) return;
    void publicClient.readContract({ address: DUEL_V2_ADDRESS, abi, functionName: "lastDuelId", args: [address] })
      .then((id) => setDuelId(id as bigint)).catch((error) => setLocalError(friendlyError(error)));
  }, [duelReceipt.isSuccess, address, publicClient]);

  const retrieve = useCallback(async (id: bigint | null = duelId) => {
    if (!address || !DUEL_V2_ADDRESS || !publicClient || !walletClient || id === null) return;
    setIsDecrypting(true); setLocalError(null);
    try {
      const duel = await publicClient.readContract({ address: DUEL_V2_ADDRESS, abi, functionName: "getMyDuel", args: [id], account: address }) as readonly [bigint,bigint,bigint,bigint,boolean];
      const decrypted = await (await getIncoLightning()).attestedDecrypt(walletClient as any, [duel[1], duel[2], duel[3]] as unknown as Hex[]);
      setResult({ challengeId: duel[0], playerTechnique: BigInt(decrypted[0].plaintext.value), opponentTechnique: BigInt(decrypted[1].plaintext.value), outcome: BigInt(decrypted[2].plaintext.value), settled: duel[4] });
    } catch (error) { setLocalError(friendlyError(error)); }
    finally { setIsDecrypting(false); }
  }, [address, publicClient, walletClient, duelId]);

  const settleDuel = useCallback((id: bigint | null = duelId) => {
    if (!DUEL_V2_ADDRESS || id === null) return;
    setLocalError(null);
    settleWrite.writeContract({ address: DUEL_V2_ADDRESS, abi, functionName: "settleDuel", args: [id] });
  }, [duelId, settleWrite]);

  const error = localError || (duelWrite.error ? friendlyError(duelWrite.error) : null) || (settleWrite.error ? friendlyError(settleWrite.error) : null);
  const busy = isEncrypting || isDecrypting || duelWrite.isPending || duelReceipt.isLoading || settleWrite.isPending || settleReceipt.isLoading;
  return { address, contractAddress: DUEL_V2_ADDRESS, isConfigured: !!DUEL_V2_ADDRESS, play, retrieve, settleDuel, duelId, result, duelTxHash: duelWrite.data, settleTxHash: settleWrite.data, isEncrypting, isDecrypting, isDuelPending: duelWrite.isPending, isDuelConfirming: duelReceipt.isLoading, isDuelSuccess: duelReceipt.isSuccess, isSettlePending: settleWrite.isPending, isSettleConfirming: settleReceipt.isLoading, isSettleSuccess: settleReceipt.isSuccess, busy, error };
}
