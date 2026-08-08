export type TransactionStage =
  | "Encrypting..."
  | "Preparing Transaction..."
  | "Waiting for Wallet..."
  | "Transaction Submitted..."
  | "Waiting for Confirmation..."
  | "Confidential Computation..."
  | "Decrypting..."
  | "Complete."
  | null;

export function TransactionStatus({ stage }: { stage: TransactionStage }) {
  if (!stage) return null;
  const complete = stage === "Complete.";
  return (
    <div aria-live="polite" className="flex items-center gap-3 border border-border bg-background/65 px-4 py-3 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${complete ? "bg-emerald-500" : "animate-pulse bg-foreground"}`} />
      <span>{stage}</span>
    </div>
  );
}
