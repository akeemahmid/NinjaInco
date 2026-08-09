"use client";

import { useCallback } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { Address, Hex } from "viem";
import trainingV2Abi from "@/abi/ninjaIncoTrainingV2.json";
import { friendlyError } from "@/lib/errors";

const TRAINING_V2_ADDRESS = process.env.NEXT_PUBLIC_NINJAINCO_TRAINING_V2_ADDRESS as Address | undefined;

export function useNinjaTrainingV2() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  const train = useCallback((actionId: Hex) => {
    if (!TRAINING_V2_ADDRESS) return;
    writeContract({ address: TRAINING_V2_ADDRESS, abi: trainingV2Abi, functionName: "train", args: [actionId] });
  }, [writeContract]);

  return { contractAddress: TRAINING_V2_ADDRESS, isConfigured: !!TRAINING_V2_ADDRESS, train, txHash, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, error: error ? friendlyError(error) : null };
}
