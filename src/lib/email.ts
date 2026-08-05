import { Resend } from "resend";

import { env } from "~/env";
import { appSettings } from "~/lib/app";

/**
 * Transactional email helper (verification links, password reset links).
 *
 * Uses Resend when RESEND_API_KEY is set. Without a key the helper keeps the
 * dev-friendly behavior: it prints the action link to the server console so
 * local flows stay testable with zero setup (and never leaks the link in
 * production).
 */
let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  // Cache the client; Resend's SDK is cheap to construct but stateless.
  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

/** Sender address. Defaults to Resend's shared test domain (onboarding@resend.dev). */
function fromAddress(): string {
  return env.RESEND_EMAIL_FROM ?? `onboarding@resend.dev`;
}

export async function sendActionEmail(opts: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): Promise<void> {
  const client = getResend();
  const { to, subject, heading, body, ctaLabel, ctaUrl } = opts;

  if (!client) {
    // No provider configured. Dev: log the link (testable without setup).
    // Prod: log a clear error WITHOUT the link - the URL embeds a secret
    // token and must never reach the logs.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[better-auth] ${subject} for ${to} (no email provider, dev log):\n${ctaUrl}`,
      );
      return;
    }
    console.error(
      "[better-auth] Email sending is enabled but RESEND_API_KEY is not " +
        "configured. Set it in your environment (see .env.example) so users " +
        "receive their emails.",
    );
    return;
  }

  const html = buildHtml({ heading, body, ctaLabel, ctaUrl });

  const { error } = await client.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });
  // The v6 SDK throws on API errors too - this covers the returned-error
  // branch of its Response<T> type. Either way the failure propagates to
  // the better-auth hook that called us.
  if (error) {
    throw new Error(error.message ?? "Failed to send email.");
  }
}

/** Inline-styled HTML (email clients strip <style> tags and Tailwind). */
function buildHtml(opts: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const { heading, body, ctaLabel, ctaUrl } = opts;
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#71717a;text-transform:uppercase;">${escapeHtml(appSettings.name)}</p>
                <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#18181b;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(body)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">${escapeHtml(ctaLabel)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                  This link expires after one hour. If you didn't request this,
                  you can safely ignore this email.
                </p>
                <p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                  <a href="${escapeHtml(ctaUrl)}" style="color:#a1a1aa;">${escapeHtml(ctaUrl)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Minimal HTML escaping for interpolated values. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
