"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { type Address, type Hex } from "viem";
import { handleTypes } from "@inco/lightning-js";
import { getIncoLightning } from "@/lib/network";
import ninjaIncoGameAbi from "@/abi/ninjaIncoGame.json";
import { friendlyError } from "@/lib/errors";
import type { TransactionStage } from "@/components/TransactionStatus";

export const VILLAGES = ["Ember", "Mist", "Storm", "Stone"] as const;
export const TECHNIQUES = ["Shadow Blade", "Spirit Guard", "Phantom Step"] as const;

const GAME_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_ADDRESS as Address | undefined;

const getFeeAbi = [
  {
    type: "function" as const,
    inputs: [],
    name: "getFee",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure" as const,
  },
];

let lightningInstance: any = null;

async function getLightning() {
  if (!lightningInstance) lightningInstance = await getIncoLightning();
  return lightningInstance;
}

interface RegisterInput {
  displayName: string;
  village: number;
  technique: number;
}

export function useNinjaRegistration() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedTechnique, setDecryptedTechnique] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const sessionRef = useRef(0);

  const {
    data: registeredData,
    isLoading: isRegistrationLoading,
    refetch: refetchRegistration,
  } = useReadContract({
    address: GAME_ADDRESS,
    abi: ninjaIncoGameAbi,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!GAME_ADDRESS && !!address },
  });

  const isRegistered = registeredData === true;

  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useReadContract({
    address: GAME_ADDRESS,
    abi: ninjaIncoGameAbi,
    functionName: "getPublicProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!GAME_ADDRESS && !!address && isRegistered },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isSuccess: txConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!txConfirmed) return;
    refetchRegistration();
    refetchProfile();
  }, [txConfirmed, refetchRegistration, refetchProfile]);

  useEffect(() => {
    // Confidential plaintext, handles, transactions, and loading state are wallet-scoped.
    // Invalidate them immediately on account/network changes or disconnect.
    sessionRef.current += 1;
    setDecryptedTechnique(null);
    setIsEncrypting(false);
    setIsDecrypting(false);
    setLocalError(null);
    resetWrite();
    return () => { sessionRef.current += 1; };
  }, [address, chainId, resetWrite]);

  const registerPlayer = useCallback(async ({ displayName, village, technique }: RegisterInput) => {
    if (!address || !GAME_ADDRESS || !publicClient) return;
    setLocalError(null);
    setIsEncrypting(true);
    const session = sessionRef.current;

    try {
      const lightning = await getLightning();
      const encryptedTechnique = await lightning.encrypt(BigInt(technique), {
        accountAddress: address,
        dappAddress: GAME_ADDRESS,
        handleType: handleTypes.euint256,
      });

      const fee = (await publicClient.readContract({
        address: lightning.executorAddress,
        abi: getFeeAbi,
        functionName: "getFee",
      })) as bigint;

      if (session !== sessionRef.current) return;
      setIsEncrypting(false);
      writeContract({
        address: GAME_ADDRESS,
        abi: ninjaIncoGameAbi,
        functionName: "registerPlayer",
        args: [displayName.trim(), village, encryptedTechnique],
        value: fee,
      });
    } catch (error) {
      if (session !== sessionRef.current) return;
      setIsEncrypting(false);
      setLocalError(friendlyError(error));
    }
  }, [address, publicClient, writeContract]);

  const decryptTechnique = useCallback(async () => {
    if (!address || !GAME_ADDRESS || !publicClient || !walletClient) return;
    setLocalError(null);
    setIsDecrypting(true);
    const session = sessionRef.current;

    try {
      const handle = (await publicClient.readContract({
        address: GAME_ADDRESS,
        abi: ninjaIncoGameAbi,
        functionName: "getEncryptedTechnique",
        account: address,
      })) as Hex;

      const lightning = await getLightning();
      const [result] = await lightning.attestedDecrypt(walletClient as any, [handle]);
      const value = result.plaintext.value;
      if (session === sessionRef.current) setDecryptedTechnique(Number(value));
    } catch (error) {
      if (session === sessionRef.current) setLocalError(friendlyError(error));
    } finally {
      if (session === sessionRef.current) setIsDecrypting(false);
    }
  }, [address, publicClient, walletClient]);

  const profileTuple = profileData as readonly [Address, string, number, bigint] | undefined;
  const profile = profileTuple
    ? {
        wallet: profileTuple[0],
        displayName: profileTuple[1],
        village: Number(profileTuple[2]),
        createdAt: profileTuple[3],
      }
    : null;

  const stage: TransactionStage = isEncrypting ? "Encrypting..." : isWritePending ? "Waiting for Wallet..." : txHash && isConfirming ? "Waiting for Confirmation..." : isDecrypting ? "Decrypting..." : txConfirmed ? "Complete." : null;
  return {
    address,
    contractAddress: GAME_ADDRESS,
    isConfigured: !!GAME_ADDRESS,
    isRegistered,
    profile,
    registerPlayer,
    decryptTechnique,
    decryptedTechnique,
    isEncrypting,
    isDecrypting,
    isWritePending,
    txConfirmed,
    stage,
    busy: isEncrypting || isWritePending || isConfirming || isDecrypting,
    error: localError || (writeError ? friendlyError(writeError) : null),
    isLoading: isRegistrationLoading || isProfileLoading,
  };
}
