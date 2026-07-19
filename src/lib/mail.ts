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

type ResolveResult = { ok: true; config: SmtpConfig } | { ok: false; reason: string };

/**
 * DB config (set in /admin under „Standort & Kontakt" → SMTP) takes
 * precedence, falling back to the SMTP_* environment variables per field so
 * an env-var-only deployment keeps working untouched. Reads via the
 * service-role client — this runs from the public contact form (an
 * anonymous visitor's request), and `smtp_settings` is intentionally not
 * readable by `anon`/`authenticated` directly (see the migration).
 */
async function resolveSmtpConfig(): Promise<ResolveResult> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("smtp_settings").select("*").eq("id", 1).maybeSingle();

  const host = data?.host || process.env.SMTP_HOST;
  if (!host) {
    return {
      ok: false,
      reason:
        'Kein SMTP-Server konfiguriert — weder im Admin unter „Standort & Kontakt" → SMTP noch als SMTP_HOST-Umgebungsvariable.',
    };
  }
  const notifyEmail = data?.notify_email || process.env.CONTACT_NOTIFY_EMAIL;
  if (!notifyEmail) {
    return {
      ok: false,
      reason:
        'Server ist konfiguriert, aber es fehlt die Empfänger-Adresse — bitte im Admin unter „Standort & Kontakt" → SMTP das Feld „Benachrichtigung an" ausfüllen (oder CONTACT_NOTIFY_EMAIL setzen).',
    };
  }

  return {
    ok: true,
    config: {
      host,
      port: data?.port ?? Number(process.env.SMTP_PORT ?? 587),
      user: data?.username || process.env.SMTP_USER || null,
      password: data?.password || process.env.SMTP_PASSWORD || null,
      from: data?.from_address || process.env.SMTP_FROM || null,
      notifyEmail,
    },
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
 * error to the visitor. An unconfigured server is a normal, expected state
 * (nothing set up yet) and is skipped without logging anything.
 */
export async function sendContactNotification(msg: ContactMessage): Promise<void> {
  try {
    const result = await resolveSmtpConfig();
    if (!result.ok) return;

    await transportFor(result.config).sendMail({
      from: result.config.from ?? result.config.user ?? result.config.notifyEmail,
      to: result.config.notifyEmail,
      replyTo: msg.email,
      subject: `Neue Kontaktanfrage von ${msg.name}`,
      text: `Name: ${msg.name}\nE-Mail: ${msg.email}\nTelefon: ${msg.phone ?? "-"}\nSprache: ${msg.locale ?? "-"}\n\n${msg.message}`,
    });
  } catch (e) {
    console.error("[contact] SMTP-Benachrichtigung fehlgeschlagen:", e);
  }
}

/** Sends a real test email using the current config (DB, falling back to env). Used by the admin "test" button — unlike sendContactNotification, this reports the specific failure reason back to the caller instead of swallowing it. */
export async function sendTestEmail(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const result = await resolveSmtpConfig();
    if (!result.ok) return { ok: false, error: result.reason };

    await transportFor(result.config).sendMail({
      from: result.config.from ?? result.config.user ?? result.config.notifyEmail,
      to: result.config.notifyEmail,
      subject: "Test-E-Mail von Taverna Zeus",
      text: `Diese Test-E-Mail bestätigt, dass die SMTP-Einstellungen funktionieren.\nGesendet: ${new Date().toLocaleString("de-DE")}`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
