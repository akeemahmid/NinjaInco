export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) {
    return "Wallet rejected the transaction.";
  }
  if (lower.includes("chain") && (lower.includes("switch") || lower.includes("unsupported") || lower.includes("wrong"))) {
    return "Please switch to the supported network.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout") || lower.includes("rpc")) {
    return "Network unavailable. Please try again.";
  }
  if (lower.includes("decrypt") || lower.includes("cipher") || lower.includes("attestation") || lower.includes("inco")) {
    return "Confidential computation failed. Please try again.";
  }
  if (lower.includes("insufficient funds")) return "Your wallet does not have enough funds for this transaction.";
  return "Something went wrong. Please try again.";
}
