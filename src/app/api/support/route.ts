// src/app/api/support/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import nodemailer, { Transporter } from "nodemailer";

interface SupportMeta {
  page?: string;
  ts?: string;
  userAgent?: string;
  ip?: string;
}

interface SupportBody {
  role: "business" | "customer";
  merchantId?: string;
  name: string;
  businessName?: string;
  email: string;
  message: string;
  honey?: string;
  meta?: SupportMeta;
}

// ---------- helpers ----------

function readIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  const r = req.headers.get("x-real-ip");
  if (r) return r;
  return "";
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function makeTransport(): Transporter {
  const user = process.env.MS365_SMTP_USER ?? "";
  const pass =
    process.env.MS365_SMP_PASS ??
    process.env.MS365_SMTP_PASS ??
    "";
  const host = process.env.MS365_SMTP_HOST ?? "smtp.office365.com";
  const port = Number(process.env.MS365_SMTP_PORT ?? 587);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ---------- HTML emails ----------

function ownerEmailHtml(d: {
  role: "business" | "customer";
  merchantId?: string;
  name: string;
  businessName?: string;
  email: string;
  message: string;
  meta: SupportMeta;
}): string {
  return `
<div style="font:15px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1220;">
  <h1 style="font-size:24px;margin:0 0 16px;">New Get On Blockchain support request</h1>

  <p style="margin:6px 0;"><strong>Type:</strong> ${escapeHtml(
    d.role === "business" ? "Business" : "Customer"
  )}</p>
  <p style="margin:6px 0;"><strong>Name:</strong> ${escapeHtml(d.name)}</p>
  ${
    d.businessName
      ? `<p style="margin:6px 0;"><strong>Business:</strong> ${escapeHtml(
          d.businessName
        )}</p>`
      : ""
  }
  ${
    d.merchantId
      ? `<p style="margin:6px 0;"><strong>Merchant ID:</strong> ${escapeHtml(
          d.merchantId
        )}</p>`
      : ""
  }
  <p style="margin:6px 0;"><strong>Email:</strong> ${escapeHtml(d.email)}</p>

  <p style="margin:10px 0;"><strong>Message:</strong><br/>${escapeHtml(
    d.message
  )}</p>

  <hr style="border:none;border-top:1px solid #dde3ea;margin:18px 0;" />

  <p style="margin:4px 0;">
    <strong>Page:</strong> ${escapeHtml(d.meta.page ?? "")}
  </p>
  <p style="margin:4px 0;">
    <strong>Submitted at:</strong> ${escapeHtml(d.meta.ts ?? "")}
  </p>
  <p style="margin:4px 0;">
    <strong>User agent:</strong> ${escapeHtml(d.meta.userAgent ?? "")}
  </p>
  <p style="margin:4px 0;">
    <strong>IP:</strong> ${escapeHtml(d.meta.ip ?? "")}
  </p>
</div>`;
}

function userEmailHtml(d: {
  name: string;
  role: "business" | "customer";
}): string {
  const roleLabel = d.role === "business" ? "your business" : "your rewards";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:14px;font:15px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1220;">
        <tr>
          <td style="padding:18px 22px;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:800;font-size:22px;color:#244b7a;">Get On Blockchain</div>
            <div style="font-size:13px;color:#6b7280;margin-top:4px;">
              Web3 rewards and loyalty your customers actually use.
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 22px 10px 22px;">
            <p style="margin:0 0 12px;">Hi ${escapeHtml(d.name)},</p>
            <p style="margin:0 0 12px;">
              Thanks for reaching out to <strong>Get On Blockchain</strong> about ${roleLabel}.
              We’ve received your message and will review it shortly.
            </p>
            <p style="margin:0 0 12px;">
              If anything is urgent (or you realize you forgot a detail), you can simply reply
              to this email and it will come straight to our inbox.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 22px 20px 22px;">
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
              — Get On Blockchain support
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// ---------- POST handler ----------

export async function POST(req: NextRequest) {
  try {
    const ip = readIp(req);
    const ua = req.headers.get("user-agent") ?? "";
    const nowIso = new Date().toISOString();

    const body = (await req.json()) as SupportBody;

    // honeypot
    if (body.honey && body.honey.trim().length > 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const role: "business" | "customer" =
      body.role === "customer" ? "customer" : "business";

    const name = (body.name ?? "").trim() || "Friend";
    const email = (body.email ?? "").trim();
    const message = (body.message ?? "").trim();
    const businessName = (body.businessName ?? "").trim() || undefined;
    const merchantId = (body.merchantId ?? "").trim() || undefined;

    if (!email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const meta: SupportMeta = {
      page: body.meta?.page ?? "/support",
      ts: body.meta?.ts ?? nowIso,
      userAgent: body.meta?.userAgent ?? ua,
      ip,
    };

    const transporter = makeTransport();

    // Owner email
    const ownerHtml = ownerEmailHtml({
      role,
      merchantId,
      name,
      businessName,
      email,
      message,
      meta,
    });

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME ?? "Get On Blockchain"}" <${
        process.env.MS365_SMTP_USER
      }>`,
      to: process.env.MAIL_TO_OWNER ?? "sales@getonblockchain.com",
      subject: "New Get On Blockchain support request",
      html: ownerHtml,
    });

    // User auto-reply
    const userHtml = userEmailHtml({ name, role });

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME ?? "Get On Blockchain"}" <${
        process.env.MS365_SMTP_USER
      }>`,
      to: email,
      subject: "We’ve received your request – Get On Blockchain",
      html: userHtml,
    });

    return NextResponse.json({ ok: true, emailOk: true });
  } catch (e) {
    console.error("support POST error:", e);
    return NextResponse.json(
      { ok: false, emailOk: false, error: errMsg(e) },
      { status: 500 }
    );
  }
}
