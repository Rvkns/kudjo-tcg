'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';


interface DiscountItem {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  code: string;
  sconto_percentuale: number;
  concorso_nome: string | null;
  collection_set_nome: string | null;
  source: string;
  created_at: string;
}

export default function AdminScontiDashboardPage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async (tok: string) => {
    setFetchError('');
    try {
      const res = await fetch('/api/admin/discounts', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
        return;
      }
      setDiscounts(json.discounts ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg || 'Errore nel recupero degli sconti.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const admin = await verifyAdminAccess();
      if (!admin) {
        router.replace('/');
        return;
      }
      const tok = admin.token;
      setToken(tok);
      setIsAdmin(true);
      await fetchDiscounts(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchDiscounts]);

  const handleRevoke = async (id: string, code: string, userEmail: string) => {
    if (!confirm(`Sei sicuro di voler revocare lo sconto "${code}" dell'utente "${userEmail}"?\n\nIl codice verrÃ  rimosso ed eliminerÃ  la possibilitÃ  dell'utente di usufruirne.`)) {
      return;
    }

    setRevokingId(id);
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setRevokingId(null);

      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }

      await fetchDiscounts(token);
    } catch (err: unknown) {
      setRevokingId(null);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore di rete: ${msg}`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const filteredDiscounts = useMemo(() => {
    if (!search.trim()) return discounts;
    const q = search.toLowerCase();
    return discounts.filter(
      d =>
        d.code.toLowerCase().includes(q) ||
        d.user_email.toLowerCase().includes(q) ||
        d.user_full_name.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q)
    );
  }, [discounts, search]);

  const stats = useMemo(() => {
    const totalCount = discounts.length;
    const uniqueUsersCount = new Set(discounts.map(d => d.user_id)).size;
    const avgPercent = totalCount > 0
      ? Math.round(discounts.reduce((sum, d) => sum + d.sconto_percentuale, 0) / totalCount)
      : 0;
    return { totalCount, uniqueUsersCount, avgPercent };
  }, [discounts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento Sconti Utenti...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">â† Sito</Link>
            <span className="text-neutral-700">/</span>
            <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-semibold">Sconti Utenti</span>
          </div>
          <Link
            href="/admin/sconti/assegna"
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            <span>ï¼‹</span> Assegna Sconto Manuale
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Gestione <span className="text-emerald-400 font-semibold">Sconti Utenti</span>
          </h1>
          <p className="text-neutral-500 text-sm">Visualizza tutti i codici sconto riscattati dai completamenti dei Collection Sets o assegnati manualmente agli utenti.</p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-1">Codici Attivi</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.totalCount}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-1">Utenti Beneficiari</div>
            <div className="text-2xl font-bold text-white">{stats.uniqueUsersCount}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-1">Sconto Medio</div>
            <div className="text-2xl font-bold text-amber-400">{stats.avgPercent}%</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per codice sconto, email utente, nome o origine..."
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {filteredDiscounts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <div className="text-5xl mb-4">ðŸ’¸</div>
            <p className="text-neutral-400 text-sm mb-4">
              {search.trim() ? 'Nessun codice sconto corrisponde alla ricerca.' : 'Nessun codice sconto utente registrato.'}
            </p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-neutral-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6 font-semibold">Utente</th>
                    <th className="py-4 px-6 font-semibold">Codice Sconto</th>
                    <th className="py-4 px-6 font-semibold">Valore</th>
                    <th className="py-4 px-6 font-semibold">Origine Sconto</th>
                    <th className="py-4 px-6 font-semibold">Data Creazione</th>
                    <th className="py-4 px-6 font-semibold text-right">AziÃ³ne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDiscounts.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{d.user_full_name}</div>
                        <div className="text-neutral-500 text-[11px]">{d.user_email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded">
                            {d.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(d.code)}
                            className="text-[10px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="Copia codice"
                          >
                            {copiedCode === d.code ? 'âœ“ Copiato' : 'ðŸ“‹'}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1 rounded-full text-xs">
                          -{d.sconto_percentuale}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-neutral-300">
                        {d.source}
                      </td>
                      <td className="py-4 px-6 text-neutral-500 font-mono">
                        {new Date(d.created_at).toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-US', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevoke(d.id, d.code, d.user_email)}
                          disabled={revokingId === d.id}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded transition-all cursor-pointer disabled:opacity-50"
                        >
                          {revokingId === d.id ? 'Revoca...' : 'ðŸš« Revoca'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
