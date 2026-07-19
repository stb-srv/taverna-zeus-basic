import "server-only";
import nodemailer from "nodemailer";

type ContactMessage = {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  locale: string | null;
};

/**
 * Best-effort SMTP notification for a new contact-form submission. Never
 * throws — the message is already saved in `contact_messages` by the time
 * this runs, so a broken/unconfigured mail server must never surface as an
 * error to the visitor.
 */
export async function sendContactNotification(msg: ContactMessage): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, CONTACT_NOTIFY_EMAIL } =
    process.env;
  if (!SMTP_HOST || !CONTACT_NOTIFY_EMAIL) return; // not configured — skip silently

  try {
    const port = Number(SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      // Nodemailer leitet `secure` NICHT automatisch aus dem Port ab — Port 465
      // braucht implizites TLS (secure: true), sonst schlägt der Verbindungsaufbau
      // bei den meisten Providern (Strato, IONOS, GMX, ...) fehl.
      secure: port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to: CONTACT_NOTIFY_EMAIL,
      replyTo: msg.email,
      subject: `Neue Kontaktanfrage von ${msg.name}`,
      text: `Name: ${msg.name}\nE-Mail: ${msg.email}\nTelefon: ${msg.phone ?? "-"}\nSprache: ${msg.locale ?? "-"}\n\n${msg.message}`,
    });
  } catch (e) {
    console.error("[contact] SMTP-Benachrichtigung fehlgeschlagen:", e);
  }
}
