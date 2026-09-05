"use client";

/**
 * Surfaces the last request receipt.
 * Shows model + tokens + digest prefix. No price.
 */

import { ReceiptTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { RequestReceipt } from "@/lib/receipts";

export function RequestReceiptChip() {
  const [receipt, setReceipt] = useState<RequestReceipt | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<RequestReceipt>).detail;
      if (detail?.digest) {
        setReceipt(detail);
      }
    };
    window.addEventListener("iris:request-receipt", handler);
    return () => window.removeEventListener("iris:request-receipt", handler);
  }, []);

  if (!receipt) {
    return null;
  }

  const shortDigest = receipt.digest.slice(0, 12);
  const model =
    receipt.actual_model_id.split("/").at(-1) ?? receipt.actual_model_id;
  const fallback = receipt.did_fallback ? " · fallback" : "";

  return (
    <div
      aria-live="polite"
      className="mx-auto mb-1 flex w-fit max-w-full flex-col items-center gap-0.5 rounded-full border border-[rgba(15,118,110,0.35)] bg-[rgba(15,118,110,0.12)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#5eead4]"
      role="status"
      title={receipt.digest}
    >
      <span className="flex items-center gap-1.5">
        <ReceiptTextIcon aria-hidden="true" className="size-3" />
        <span>
          Receipt · {model}
          {fallback} · {receipt.total_tokens} tok · {shortDigest}
        </span>
      </span>
      <span className="normal-case tracking-normal opacity-80">
        SHA-256 of what ran. Not an invoice.
      </span>
    </div>
  );
}
