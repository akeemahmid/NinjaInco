"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from "wagmi";
import { bytesToHex, pad, toHex, type Address, type Hex } from "viem";
import { getIncoLightning } from "@/lib/network";
import { friendlyError } from "@/lib/errors";
import promotionV2Abi from "@/abi/ninjaIncoPromotionV2.json";

const PROMOTION_V2_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_PROMOTION_V2_ADDRESS as Address | undefined;
const abi = promotionV2Abi as any;
export type PromotionV2Status = "idle" | "evaluating" | "awaiting-attestation" | "ready-to-finalize" | "finalizing" | "success" | "error";
export interface PromotionV2Attestation { handle: Hex; value: Hex; signatures: Hex[] }

export function useNinjaPromotionV2() {
  const { address, chainId } = useAccount(); const publicClient = usePublicClient(); const { data: walletClient } = useWalletClient();
  const evaluation = useReadContract({ address: PROMOTION_V2_ADDRESS, abi, functionName: "getEvaluation", args: address ? [address] : undefined, query: { enabled: !!PROMOTION_V2_ADDRESS && !!address } });
  const evaluateWrite = useWriteContract(); const finalizeWrite = useWriteContract();
  const evaluateReceipt = useWaitForTransactionReceipt({ hash: evaluateWrite.data }); const finalizeReceipt = useWaitForTransactionReceipt({ hash: finalizeWrite.data });
  const [attestation, setAttestation] = useState<PromotionV2Attestation | null>(null); const [status, setStatus] = useState<PromotionV2Status>("idle"); const [error, setError] = useState<string | null>(null); const session = useRef(0); const processed = useRef<Hex | undefined>(undefined);

  useEffect(() => { session.current += 1; setAttestation(null); setStatus("idle"); setError(null); processed.current = undefined; }, [address, chainId]);
  useEffect(() => { if (!evaluateReceipt.isSuccess || !address || !publicClient || !walletClient || processed.current === evaluateWrite.data) return; processed.current = evaluateWrite.data; const current = session.current; setStatus("awaiting-attestation"); void (async () => { try { const handle = await publicClient.readContract({ address: PROMOTION_V2_ADDRESS!, abi, functionName: "getPendingEligibility", args: [address] }) as Hex; const [result] = await (await getIncoLightning()).attestedDecrypt(walletClient as any, [handle]); if (current !== session.current) return; const raw = result.plaintext.value; const eligible = typeof raw === "boolean" ? raw : raw === BigInt(1); if (!eligible) { setStatus("idle"); setError("Promotion requirements are not yet satisfied."); return; } const value = pad(toHex(eligible ? 1 : 0), { size: 32 }); setAttestation({ handle: result.handle as Hex, value, signatures: result.covalidatorSignatures.map((s: Uint8Array) => bytesToHex(s)) }); setStatus("ready-to-finalize"); } catch (e) { if (current === session.current) { setStatus("error"); setError(friendlyError(e)); } } })(); }, [evaluateReceipt.isSuccess, evaluateWrite.data, address, publicClient, walletClient]);
  useEffect(() => { if (finalizeReceipt.isSuccess) { setStatus("success"); setAttestation(null); void evaluation.refetch(); } }, [finalizeReceipt.isSuccess, evaluation.refetch]);
  const evaluate = useCallback(() => { if (!PROMOTION_V2_ADDRESS) return; setError(null); setAttestation(null); setStatus("evaluating"); evaluateWrite.writeContract({ address: PROMOTION_V2_ADDRESS, abi, functionName: "evaluatePromotion" }); }, [evaluateWrite]);
  const finalize = useCallback(() => { if (!address || !PROMOTION_V2_ADDRESS || !attestation) return; setError(null); setStatus("finalizing"); finalizeWrite.writeContract({ address: PROMOTION_V2_ADDRESS, abi, functionName: "finalizePromotion", args: [address, { handle: attestation.handle, value: attestation.value }, attestation.signatures] }); }, [address, attestation, finalizeWrite]);
  const writeError = evaluateWrite.error || finalizeWrite.error;
  return { address, contractAddress: PROMOTION_V2_ADDRESS, isConfigured: !!PROMOTION_V2_ADDRESS, evaluation: evaluation.data, eligible: status === "ready-to-finalize" || status === "success", attestation, status, evaluate, finalize, txHash: finalizeWrite.data ?? evaluateWrite.data, isPending: evaluateWrite.isPending || finalizeWrite.isPending, isConfirming: evaluateReceipt.isLoading || finalizeReceipt.isLoading, isSuccess: finalizeReceipt.isSuccess, error: error || (writeError ? friendlyError(writeError) : null), refetch: evaluation.refetch };
}
