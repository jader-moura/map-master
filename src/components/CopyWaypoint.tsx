"use client";

import { useState } from "react";
import { Icon, P } from "@/components/icons";

// Copy a GW2 waypoint chat code (e.g. "[&BBAEAAA=]") to the clipboard so it can
// be pasted into the in-game chat to open the map at that waypoint. Same UX as
// the boss timer's "Copy waypoint" button.
export default function CopyWaypoint({
  code,
  label,
  compact = false,
}: {
  code: string;
  label?: string;
  /** Icon-only square button, for tight spots like list cards. */
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  // stopPropagation so a copy click inside a clickable card doesn't also follow
  // the card's link.
  function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        title={`Copy waypoint code ${code}`}
        aria-label="Copy waypoint location"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-orange-400/40 bg-orange-400/15 text-orange-300 transition hover:bg-orange-400/25"
      >
        <Icon path={copied ? P.check : P.pin} className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy waypoint code ${code}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/40 bg-orange-400/15 px-2.5 py-1.5 text-xs font-semibold text-orange-300 transition hover:bg-orange-400/25"
    >
      <Icon path={copied ? P.check : P.copy} className="h-3.5 w-3.5" />
      {copied ? "Copied!" : (label ?? "Copy waypoint")}
    </button>
  );
}
