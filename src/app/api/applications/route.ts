import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { paymentFor, euro } from '@/lib/loan';

export const runtime = 'nodejs';
const amountRange = [1_000, 250_000] as const;
const termRange = [12, 120] as const;
const purposes = new Set(['Freie Verwendung', 'Autokredit', 'Umschuldung', 'Modernisierung', 'Gewerbe']);

export async function POST(request: Request) {
  try {
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      return NextResponse.json({ error: 'Ungültiges Anfrageformat.' }, { status: 415 });
    }
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 16_384) return NextResponse.json({ error: 'Die Anfrage ist zu groß.' }, { status: 413 });

    // Guard browser submissions against cross-origin requests while honoring reverse-proxy hosts.
    const origin = request.headers.get('origin');
    if (origin) {
      const originHost = new URL(origin).host;
      const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
      if (!requestHost || originHost !== requestHost) {
        return NextResponse.json({ error: 'Ungültige Herkunft der Anfrage.' }, { status: 403 });
      }
    }

    const rawBody = await request.text();
    if (rawBody.length > 16_384) return NextResponse.json({ error: 'Die Anfrage ist zu groß.' }, { status: 413 });
    const body: unknown = JSON.parse(rawBody);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Bitte prüfen Sie Ihre Angaben.' }, { status: 400 });
    }
    const data = body as Record<string, unknown>;
    const text = (key: string, max: number) => typeof data[key] === 'string' && data[key].trim().length > 0 && data[key].trim().length <= max;
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (
      !text('firstName', 80) || !text('lastName', 80) || !text('postcode', 12) || !text('city', 100) ||
      !text('purpose', 80) || !purposes.has(String(data.purpose).trim()) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !Number.isFinite(data.amount) || Number(data.amount) < amountRange[0] || Number(data.amount) > amountRange[1] ||
      !Number.isInteger(data.term) || Number(data.term) < termRange[0] || Number(data.term) > termRange[1] ||
      data.consent !== true || (data.phone !== undefined && typeof data.phone !== 'string')
    ) {
      return NextResponse.json({ error: 'Bitte prüfen Sie Ihre Angaben und bestätigen Sie die Datenschutzhinweise.' }, { status: 400 });
    }

    // Never claim a request was accepted if it cannot actually be stored.
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Das Anfrageformular ist noch nicht eingerichtet. Bitte versuchen Sie es später erneut.' }, { status: 503 });
    }

    const application = {
      first_name: String(data.firstName).trim(),
      last_name: String(data.lastName).trim(),
      email,
      phone: typeof data.phone === 'string' ? data.phone.trim().slice(0, 40) || null : null,
      postcode: String(data.postcode).trim(),
      city: String(data.city).trim(),
      amount: Number(data.amount),
      term: Number(data.term),
      purpose: String(data.purpose).trim(),
      monthly_payment: paymentFor(Number(data.amount), Number(data.term)),
      created_at: new Date().toISOString(),
    };

    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: dbError } = await db.from('applications').insert(application);
    if (dbError) {
      console.error('Application could not be stored:', dbError.code ?? 'database error');
      return NextResponse.json({ error: 'Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.' }, { status: 503 });
    }

    let confirmationEmailSent = false;
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: mailError } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Ihre Finanzierungsanfrage ist eingegangen',
        html: `<div style="font-family:Arial,sans-serif;color:#17211d;max-width:600px;margin:auto"><h1>Vielen Dank, ${escapeHtml(application.first_name)}.</h1><p>Ihre unverbindliche Finanzierungsanfrage ist bei uns eingegangen. Dies ist noch keine Kreditzusage.</p><table><tr><td>Betrag</td><td>${euro(application.amount)}</td></tr><tr><td>Laufzeit</td><td>${application.term} Monate</td></tr><tr><td>Unverbindliche Beispielrate</td><td>${euro(application.monthly_payment)} / Monat</td></tr></table><p>Wir melden uns persönlich bei Ihnen, um Ihre Möglichkeiten zu besprechen. Bitte senden Sie sensible Unterlagen nicht als Antwort auf diese E-Mail.</p><p>Freundliche Grüße<br>Ihr FinanzPartner-Team</p><hr><small>Diese Nachricht bestätigt ausschließlich den Eingang Ihrer Anfrage und ist kein Kreditangebot.</small></div>`,
      });
      confirmationEmailSent = !mailError;
      if (mailError) console.error('Application confirmation email failed:', mailError.name ?? 'mail error');
    }

    return NextResponse.json({ ok: true, confirmationEmailSent }, { status: 201 });
  } catch (error) {
    // Do not log request bodies or personal information.
    console.error('Application submission failed:', error instanceof SyntaxError ? 'invalid JSON' : 'unexpected error');
    return NextResponse.json({ error: 'Die Anfrage konnte nicht verarbeitet werden.' }, { status: 400 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
