/**
 * Erkennt Hostnamen, die auf interne Ziele zeigen (Loopback, private Netze,
 * Link-Local inkl. Cloud-Metadaten). Schützt Server-seitige Abrufe von
 * Admin-gelieferten URLs. Prüft nur den Namen, nicht die DNS-Auflösung.
 */
export function isBlockedHost(hostname: string): boolean {
  // URL.hostname liefert IPv6 in eckigen Klammern.
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".localhost") || h.endsWith(".internal")) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1) auf die IPv4-Prüfung umleiten.
  const mapped = h.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isBlockedIPv4(mapped[1]);

  const v4 = h.match(/^\d{1,3}(?:\.\d{1,3}){3}$/);
  if (v4) return isBlockedIPv4(h);

  // IPv6: Loopback, unspezifiziert, Unique-Local fc00::/7, Link-Local fe80::/10.
  if (h === "::1" || h === "::") return true;
  if (/^f[cd][0-9a-f]{0,2}:/.test(h)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true;

  return false;
}

function isBlockedIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return true; // this-host / private / loopback
  if (a === 169 && b === 254) return true; // link-local inkl. 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  return false;
}
