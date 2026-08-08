"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from "wagmi";
import { bytesToHex, pad, toHex, type Address, type Hex } from "viem";
import promotionAbi from "@/abi/ninjaIncoPromotion.json";
import { getIncoLightning } from "@/lib/network";
import { useNinjaRegistration } from "@/hooks/useNinjaRegistration";
import { friendlyError } from "@/lib/errors";
import type { TransactionStage } from "@/components/TransactionStatus";

const PROMOTION_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_PROMOTION_ADDRESS as Address | undefined;
let lightningInstance: any = null;
async function getLightning() { if (!lightningInstance) lightningInstance = await getIncoLightning(); return lightningInstance; }

export function useNinjaPromotion() {
  const { address, chainId } = useAccount(); const registration = useNinjaRegistration(); const publicClient = usePublicClient(); const { data: walletClient } = useWalletClient();
  const [action, setAction] = useState<"evaluate" | "finalize" | null>(null); const [eligible, setEligible] = useState<boolean | null>(null); const [isDecrypting, setIsDecrypting] = useState(false); const [localError, setLocalError] = useState<string | null>(null); const processedHash = useRef<Hex | undefined>(undefined); const sessionRef = useRef(0);
  const { data: rankData, refetch: refetchRank, isLoading: rankLoading } = useReadContract({ address: PROMOTION_ADDRESS, abi: promotionAbi, functionName: "rank", args: address ? [address] : undefined, query: { enabled: !!PROMOTION_ADDRESS && !!address } });
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract(); const { isSuccess: txConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    // Eligibility plaintext, its confidential handle, and attestation work are session-bound.
    sessionRef.current += 1;
    setAction(null);
    setEligible(null);
    setIsDecrypting(false);
    setLocalError(null);
    processedHash.current = undefined;
    resetWrite();
    return () => { sessionRef.current += 1; };
  }, [address, chainId, resetWrite]);

  const evaluate = useCallback(() => { if (!address || !PROMOTION_ADDRESS) return; setEligible(null); setLocalError(null); setAction("evaluate"); writeContract({ address: PROMOTION_ADDRESS, abi: promotionAbi, functionName: "evaluatePromotion" }); }, [address, writeContract]);

  useEffect(() => {
    if (!txConfirmed || !txHash || processedHash.current === txHash || !address || !PROMOTION_ADDRESS || !publicClient || !walletClient) return;
    processedHash.current = txHash;
    if (action === "finalize") { refetchRank(); return; }
    if (action !== "evaluate") return;
    const session = sessionRef.current;
    void (async () => {
      setIsDecrypting(true);
      try {
        const handle = await publicClient.readContract({ address: PROMOTION_ADDRESS, abi: promotionAbi, functionName: "getPendingEligibility", args: [address] }) as Hex;
        const [result] = await (await getLightning()).attestedDecrypt(walletClient as any, [handle]);
        if (session !== sessionRef.current) return;
        const raw = result.plaintext.value; const allowed = typeof raw === "boolean" ? raw : raw === BigInt(1); setEligible(allowed);
        if (!allowed) return;
        const signatures = result.covalidatorSignatures.map((signature: Uint8Array) => bytesToHex(signature));
        const value = pad(toHex(typeof raw === "boolean" ? (raw ? 1 : 0) : Number(raw)), { size: 32 });
        setAction("finalize");
        writeContract({ address: PROMOTION_ADDRESS, abi: promotionAbi, functionName: "finalizePromotion", args: [address, { handle: result.handle as Hex, value }, signatures] });
      } catch (error) { if (session === sessionRef.current) setLocalError(friendlyError(error)); }
      finally { if (session === sessionRef.current) setIsDecrypting(false); }
    })();
  }, [txConfirmed, txHash, action, address, publicClient, walletClient, writeContract, refetchRank]);

  const stage: TransactionStage = isPending ? "Waiting for Wallet..." : txHash && isConfirming ? "Waiting for Confirmation..." : action === "evaluate" && txConfirmed && isDecrypting ? "Confidential Computation..." : action === "finalize" && isDecrypting ? "Decrypting..." : action === "finalize" && txConfirmed ? "Complete." : null;
  return { address, isConfigured: !!PROMOTION_ADDRESS, isRegistered: registration.isRegistered, rank: Number(rankData ?? 0), evaluate, eligible, isPending, isConfirming, isDecrypting, busy: isPending || isConfirming || isDecrypting, stage, error: localError || (writeError ? friendlyError(writeError) : null), isLoading: registration.isLoading || rankLoading };
}
