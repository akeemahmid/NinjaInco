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
  const label: Record<Exclude<TransactionStage, null>, string> = {
    "Encrypting...": "Sealing technique...",
    "Preparing Transaction...": "Preparing the exam scroll...",
    "Waiting for Wallet...": "Awaiting authorization...",
    "Transaction Submitted...": "Exam scroll sent...",
    "Waiting for Confirmation...": "Sending the exam scroll...",
    "Confidential Computation...": "Confidential computation...",
    "Decrypting...": "Unsealing the result...",
    "Complete.": "Ready.",
  };
  return (
    <div aria-live="polite" className="flex items-center gap-3 border border-border/70 bg-black/20 px-4 py-3 text-sm backdrop-blur-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${complete ? "bg-emerald-500" : "animate-pulse bg-foreground"}`} />
      <span>{label[stage]}</span>
    </div>
  );
}
