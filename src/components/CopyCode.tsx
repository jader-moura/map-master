"use client";

import { useState } from "react";
import { Icon, P } from "@/components/icons";

// Inline, click-to-copy chat code chip (e.g. an item or waypoint "[&...]" link).
// Use for any GW2 chat code shown in text so it can be pasted into the game.
export default function CopyCode({ code, className = "" }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied!" : `Copy chat code ${code}`}
      aria-label={`Copy chat code ${code}`}
      className={`inline-flex items-center gap-1.5 rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-white/45 transition hover:bg-white/10 hover:text-white/75 ${className}`}
    >
      <span>{code}</span>
      <Icon path={copied ? P.check : P.copy} className="h-3 w-3 shrink-0" />
    </button>
  );
}
