import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { getEnabledLocales } from "@/lib/locales";
import { logout } from "../auth-actions";
import Sidebar from "./Sidebar";
import IdleLogout from "./IdleLogout";
import { EnabledLocalesProvider } from "./EnabledLocalesContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  const enabledLocales = await getEnabledLocales();

  return (
    <EnabledLocalesProvider locales={enabledLocales}>
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/80 p-4 backdrop-blur sm:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-accent text-sm font-bold text-white shadow-sm">
            Z
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold">Meraki CMS</span>
            <span className="text-[0.7rem] text-muted">Taverna Zeus</span>
          </span>
        </Link>
        <Sidebar />
        <div className="mt-auto pt-6">
          <Link
            href="/de"
            target="_blank"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary transition hover:bg-accent-soft/60"
          >
            Website ansehen ↗
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/70 px-6 py-3 backdrop-blur-md">
          <div className="sm:hidden">
            <Link href="/admin" className="font-display text-lg font-semibold">
              Meraki CMS
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-primary-dark">
                {initial}
              </span>
              <span className="text-muted">{user.email}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 font-medium transition hover:bg-accent-soft/60"
              >
                Abmelden
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>

      <IdleLogout />
    </div>
    </EnabledLocalesProvider>
  );
}
