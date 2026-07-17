"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type Item = { href: string; label: string; icon: ReactNode; exact?: boolean };

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  const groups: { title: string; items: Item[] }[] = [
    {
      title: t("groupGeneral"),
      items: [{ href: "/admin", label: t("overview"), icon: <IconHome />, exact: true }],
    },
    {
      title: t("groupContent"),
      items: [
        { href: "/admin/menu", label: t("menu"), icon: <IconMenu /> },
        { href: "/admin/hours", label: t("hours"), icon: <IconClock /> },
        { href: "/admin/settings", label: t("settings"), icon: <IconPin /> },
        { href: "/admin/pages", label: t("pages"), icon: <IconPage /> },
        { href: "/admin/translations", label: t("translations"), icon: <IconGlobe /> },
      ],
    },
    {
      title: t("groupSystem"),
      items: [{ href: "/admin/admins", label: t("admins"), icon: <IconUsers /> }],
    },
  ];

  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted/80">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "text-foreground/70 hover:bg-accent-soft/60 hover:text-foreground"
                  }`}
                >
                  <span className={active ? "text-white" : "text-primary/80"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* --- Inline icons (no dependency) --- */

function svg(children: ReactNode) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconHome() {
  return svg(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </>,
  );
}
function IconMenu() {
  return svg(
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
  );
}
function IconClock() {
  return svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
  );
}
function IconPin() {
  return svg(
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>,
  );
}
function IconPage() {
  return svg(
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v4h4" />
      <path d="M9 13h6M9 17h6" />
    </>,
  );
}
function IconGlobe() {
  return svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18Z" />
    </>,
  );
}
function IconUsers() {
  return svg(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M18 20a6 6 0 0 0-3-5.2" />
    </>,
  );
}
