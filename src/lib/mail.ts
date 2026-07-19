import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

type ContactMessage = {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  locale: string | null;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string | null;
  password: string | null;
  from: string | null;
  notifyEmail: string;
};

/**
 * DB config (set in /admin under „Standort & Kontakt") takes precedence,
 * falling back to the SMTP_* environment variables per field so an
 * env-var-only deployment keeps working untouched. Reads via the
 * service-role client — this runs from the public contact form (an
 * anonymous visitor's request), and `smtp_settings` is intentionally not
 * readable by `anon`/`authenticated` directly (see the migration).
 */
async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("smtp_settings").select("*").eq("id", 1).maybeSingle();

  const host = data?.host || process.env.SMTP_HOST;
  const notifyEmail = data?.notify_email || process.env.CONTACT_NOTIFY_EMAIL;
  if (!host || !notifyEmail) return null; // not configured — skip silently

  return {
    host,
    port: data?.port ?? Number(process.env.SMTP_PORT ?? 587),
    user: data?.username || process.env.SMTP_USER || null,
    password: data?.password || process.env.SMTP_PASSWORD || null,
    from: data?.from_address || process.env.SMTP_FROM || null,
    notifyEmail,
  };
}

function transportFor(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // Nodemailer leitet `secure` NICHT automatisch aus dem Port ab — Port 465
    // braucht implizites TLS (secure: true), sonst schlägt der Verbindungsaufbau
    // bei den meisten Providern (Strato, IONOS, GMX, ...) fehl.
    secure: config.port === 465,
    auth: config.user ? { user: config.user, pass: config.password ?? undefined } : undefined,
  });
}

/**
 * Best-effort SMTP notification for a new contact-form submission. Never
 * throws — the message is already saved in `contact_messages` by the time
 * this runs, so a broken/unconfigured mail server must never surface as an
 * error to the visitor.
 */
export async function sendContactNotification(msg: ContactMessage): Promise<void> {
  try {
    const config = await resolveSmtpConfig();
    if (!config) return;

    await transportFor(config).sendMail({
      from: config.from ?? config.user ?? config.notifyEmail,
      to: config.notifyEmail,
      replyTo: msg.email,
      subject: `Neue Kontaktanfrage von ${msg.name}`,
      text: `Name: ${msg.name}\nE-Mail: ${msg.email}\nTelefon: ${msg.phone ?? "-"}\nSprache: ${msg.locale ?? "-"}\n\n${msg.message}`,
    });
  } catch (e) {
    console.error("[contact] SMTP-Benachrichtigung fehlgeschlagen:", e);
  }
}

/** Sends a real test email using the current config (DB, falling back to env). Used by the admin "test" button — unlike sendContactNotification, this reports failure back to the caller instead of swallowing it. */
export async function sendTestEmail(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const config = await resolveSmtpConfig();
    if (!config) {
      return {
        ok: false,
        error: "Keine SMTP-Konfiguration vorhanden (weder in der Datenbank noch als Umgebungsvariable).",
      };
    }
    await transportFor(config).sendMail({
      from: config.from ?? config.user ?? config.notifyEmail,
      to: config.notifyEmail,
      subject: "Test-E-Mail von Taverna Zeus",
      text: `Diese Test-E-Mail bestätigt, dass die SMTP-Einstellungen funktionieren.\nGesendet: ${new Date().toLocaleString("de-DE")}`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
