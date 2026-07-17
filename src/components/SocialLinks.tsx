import type { Json } from "@/lib/supabase/types";

type PlatformLink = { url: string; enabled: boolean };
type SocialLinksValue = Partial<Record<"instagram" | "facebook" | "tiktok" | "whatsapp", PlatformLink>>;

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.47" />
      <path d="M14 4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8.6 19L4 20Z" />
      <path d="M8.5 9.5c.2 2.3 2.7 4.8 5 5 .8.1 1.5-.5 1.5-1.3 0-.2 0-.4-.1-.5l-1.7-1" />
    </svg>
  );
}

/** wa.me only accepts digits (no +, spaces, dashes). */
function toWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

const PLATFORMS: {
  key: keyof SocialLinksValue;
  label: string;
  icon: () => React.ReactNode;
  href: (value: string) => string;
}[] = [
  { key: "instagram", label: "Instagram", icon: InstagramIcon, href: (url) => url },
  { key: "facebook", label: "Facebook", icon: FacebookIcon, href: (url) => url },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, href: (url) => url },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: WhatsAppIcon,
    href: (phone) => `https://wa.me/${toWhatsAppDigits(phone)}`,
  },
];

/** Renders one link per enabled, non-empty platform from `restaurant_settings.social_links`. */
export default function SocialLinks({ links }: { links: Json | null | undefined }) {
  const value = (links && typeof links === "object" ? links : {}) as SocialLinksValue;

  const active = PLATFORMS.filter((p) => {
    const entry = value[p.key];
    return entry?.enabled && entry.url.trim() !== "";
  });

  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {active.map((p) => {
        const entry = value[p.key]!;
        return (
          <a
            key={p.key}
            href={p.href(entry.url)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.label}
            title={p.label}
            className="text-white/75 transition hover:text-white"
          >
            <p.icon />
          </a>
        );
      })}
    </div>
  );
}
