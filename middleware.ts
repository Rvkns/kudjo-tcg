import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function supabaseConnectSrc(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  try {
    const host = new URL(url).host;
    return `https://${host} wss://${host}`;
  } catch {
    // No/invalid Supabase URL configured (e.g. local build without env) — fall back
    // to the generic Supabase domain so the CSP never accidentally forbids it once
    // the env var is set in production.
    return 'https://*.supabase.co wss://*.supabase.co';
  }
}

// Next.js App Router streams hydration data via inline <script> tags on every page
// load, so `'unsafe-inline'` on script-src is required unless every request is wired
// through a nonce-forwarding pipeline (fragile to compose correctly with next-intl's
// own middleware response). Everything else here is a real, restrictive allowlist:
// external script/frame/connect sources are limited to exactly the third parties this
// app talks to (Supabase, PayPal), framing is fully denied, and dangerous sinks
// (object-src, base-uri) are locked to 'none'/'self'.
const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' ${supabaseConnectSrc()} https://www.paypal.com https://www.sandbox.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com;
  frame-src https://www.paypal.com https://www.sandbox.paypal.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://checkout.stripe.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
