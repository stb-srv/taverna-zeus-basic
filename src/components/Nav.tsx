"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";

const links = [
  { href: "/", key: "home" },
  { href: "/menu", key: "menu" },
  { href: "/location", key: "location" },
] as const;

export default function Nav({
  restaurantName,
  locales,
}: {
  restaurantName: string;
  locales: Locale[];
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // A soft shadow fades in once the page is scrolled, giving the bar depth
  // without a hard border. The bar itself shares the footer's deep Aegean tone
  // so the top and bottom of every page harmonise.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`nav-solid sticky top-0 z-40 text-white backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "nav-lift" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold to-accent text-sm font-bold text-white shadow-sm">
            Z
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">{restaurantName}</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-6">
            {links.map(({ href, key }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={
                      isActive
                        ? "border-b-2 border-gold pb-0.5 font-medium"
                        : "text-white/85 transition-colors hover:text-white"
                    }
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <LanguageSwitcher locales={locales} />
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher locales={locales} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="text-2xl leading-none"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/10 px-4 py-2 md:hidden">
          {links.map(({ href, key }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="block py-2 text-white/90 hover:text-white"
              >
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
