"use client";

import { createContext, useContext } from "react";
import { DEFAULT_ENABLED_LOCALES, type Locale } from "@/i18n/routing";

const Ctx = createContext<readonly Locale[]>(DEFAULT_ENABLED_LOCALES);

/** Active locales, provided by the dashboard layout for client components. */
export function useEnabledLocales(): readonly Locale[] {
  return useContext(Ctx);
}

export function EnabledLocalesProvider({
  locales,
  children,
}: {
  locales: Locale[];
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={locales}>{children}</Ctx.Provider>;
}
