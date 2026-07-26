import { supabase } from '@/lib/supabase';

/**
 * Verifies admin access via the server (GET /api/admin/verify) instead of checking a
 * hardcoded email allowlist in client code. A hardcoded allowlist would ship the real
 * admin email addresses inside the public JS bundle, handing anyone inspecting the
 * site a ready-made target list for credential stuffing / phishing. The actual
 * authorization decision already lives server-side (every /api/admin/* route re-checks
 * the caller's email against ADMIN_EMAILS), so this is purely about not leaking the
 * list — it does not change what a non-admin can access.
 *
 * Returns the bearer token + email on success (so callers can reuse the token for
 * subsequent admin API calls), or null if the caller is not an authenticated admin.
 */
export async function verifyAdminAccess(): Promise<{ token: string; email: string } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  try {
    const res = await fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
  } catch {
    return null;
  }

  return { token, email: session?.user?.email?.toLowerCase() ?? '' };
}
