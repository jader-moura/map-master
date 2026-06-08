"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SeoModalState = { open: boolean; setOpen: (v: boolean) => void };

const Ctx = createContext<SeoModalState | null>(null);

// Holds the open/closed state of the per-page SEO modal so the sidebar info
// button (in IconRail) and the modal itself (in the page) can share it.
export function SeoModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

/** Returns null when rendered outside a provider (e.g. the 404 page). */
export function useSeoModal() {
  return useContext(Ctx);
}
