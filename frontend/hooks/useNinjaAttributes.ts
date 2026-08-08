"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWalletClient, useWriteContract } from "wagmi";
import { type Address, type Hex } from "viem";
import { handleTypes } from "@inco/lightning-js";
import { getIncoLightning } from "@/lib/network";
import attributesAbi from "@/abi/ninjaIncoAttributes.json";
import { friendlyError } from "@/lib/errors";
import type { TransactionStage } from "@/components/TransactionStatus";

const ATTRIBUTES_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_ATTRIBUTES_ADDRESS as Address | undefined;
const getFeeAbi = [{ type: "function" as const, inputs: [], name: "getFee", outputs: [{ name: "", internalType: "uint256", type: "uint256" }], stateMutability: "pure" as const }];
let lightningInstance: any = null;
async function getLightning() { if (!lightningInstance) lightningInstance = await getIncoLightning(); return lightningInstance; }

export interface RevealedAttributes { power: number; speed: number; focus: number; luck: number; chakra: number; startingStyle: number; }

function mockValues() {
  const random = new Uint32Array(6); crypto.getRandomValues(random);
  return [25 + random[0] % 66, 25 + random[1] % 66, 25 + random[2] % 66, 25 + random[3] % 66, 25 + random[4] % 66, random[5] % 3];
}

export function useNinjaAttributes() {
  const { address, chainId } = useAccount(); const publicClient = usePublicClient(); const { data: walletClient } = useWalletClient();
  const [isEncrypting, setIsEncrypting] = useState(false); const [isDecrypting, setIsDecrypting] = useState(false); const [revealedAttributes, setRevealedAttributes] = useState<RevealedAttributes | null>(null); const [localError, setLocalError] = useState<string | null>(null);
  const { data: hasAttributesData, isLoading, refetch: refetchHasAttributes } = useReadContract({ address: ATTRIBUTES_ADDRESS, abi: attributesAbi, functionName: "hasAttributes", args: address ? [address] : undefined, query: { enabled: !!ATTRIBUTES_ADDRESS && !!address } });
  const sessionRef = useRef(0);
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract(); const { isSuccess: txConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => { if (txConfirmed) refetchHasAttributes(); }, [txConfirmed, refetchHasAttributes]);
  useEffect(() => {
    // Decrypted attributes and in-flight Inco work belong to one wallet/chain session only.
    sessionRef.current += 1; setRevealedAttributes(null); setIsEncrypting(false); setIsDecrypting(false); setLocalError(null); resetWrite();
    return () => { sessionRef.current += 1; };
  }, [address, chainId, resetWrite]);

  const initializeAttributes = useCallback(async () => {
    if (!address || !ATTRIBUTES_ADDRESS || !publicClient) return; setLocalError(null); setIsEncrypting(true); const session = sessionRef.current;
    try {
      const lightning = await getLightning(); const encryptedValues = await Promise.all(mockValues().map((value) => lightning.encrypt(BigInt(value), { accountAddress: address, dappAddress: ATTRIBUTES_ADDRESS, handleType: handleTypes.euint256 })));
      const fee = await publicClient.readContract({ address: lightning.executorAddress, abi: getFeeAbi, functionName: "getFee" }) as bigint;
      if (session !== sessionRef.current) return; setIsEncrypting(false); writeContract({ address: ATTRIBUTES_ADDRESS, abi: attributesAbi, functionName: "initializeAttributes", args: [encryptedValues], value: fee * BigInt(6) });
    } catch (error) { if (session !== sessionRef.current) return; setIsEncrypting(false); setLocalError(friendlyError(error)); }
  }, [address, publicClient, writeContract]);

  const revealMyAttributes = useCallback(async () => {
    if (!address || !ATTRIBUTES_ADDRESS || !publicClient || !walletClient) return; setLocalError(null); setIsDecrypting(true); const session = sessionRef.current;
    try {
      const handles = await publicClient.readContract({ address: ATTRIBUTES_ADDRESS, abi: attributesAbi, functionName: "getMyAttributes", account: address }) as readonly Hex[];
      const results = await (await getLightning()).attestedDecrypt(walletClient as any, [...handles]); const values = results.map((result: any) => Number(result.plaintext.value));
      if (session === sessionRef.current) setRevealedAttributes({ power: values[0], speed: values[1], focus: values[2], luck: values[3], chakra: values[4], startingStyle: values[5] });
    } catch (error) { if (session === sessionRef.current) setLocalError(friendlyError(error)); } finally { if (session === sessionRef.current) setIsDecrypting(false); }
  }, [address, publicClient, walletClient]);

  const train = useCallback(() => {
    if (!address || !ATTRIBUTES_ADDRESS) return;
    setLocalError(null);
    writeContract({
      address: ATTRIBUTES_ADDRESS,
      abi: attributesAbi,
      functionName: "train",
    });
  }, [address, writeContract]);

  const stage: TransactionStage = isEncrypting ? "Encrypting..." : isPending ? "Waiting for Wallet..." : txHash && isConfirming ? "Waiting for Confirmation..." : isDecrypting ? "Decrypting..." : txConfirmed ? "Complete." : null;
  return { address, isConfigured: !!ATTRIBUTES_ADDRESS, hasAttributes: hasAttributesData === true, initializeAttributes, revealMyAttributes, train, revealedAttributes, isEncrypting, isDecrypting, isPending, isConfirming, busy: isEncrypting || isPending || isConfirming || isDecrypting, stage, txConfirmed, isLoading, error: localError || (writeError ? friendlyError(writeError) : null) };
}
