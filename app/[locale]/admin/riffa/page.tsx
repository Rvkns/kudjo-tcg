'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface ConcorsoRaffle {
  id: string;
  nome: string;
  stato: 'draft' | 'attivo' | 'concluso';
  created_at: string;
  total_tickets: number;
  total_participants: number;
  has_drawn: boolean;
  winners_count: number;
}

const STATO_COLORS: Record<string, string> = {
  draft: 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30',
  attivo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  concluso: 'bg-neutral-800/40 text-neutral-500 border-neutral-700/30',
};

const STATO_LABELS: Record<string, string> = {
  draft: '📋 Bozza',
  attivo: '🟢 Attivo',
  concluso: '⛔ Concluso',
};

export default function AdminRiffaDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [concorsi, setConcorsi] = useState<ConcorsoRaffle[]>([]);
  const [fetchError, setFetchError] = useState('');

  const fetchRaffles = useCallback(async (tok: string) => {
    setFetchError('');
    try {
      const res = await fetch('/api/admin/riffa', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
        return;
      }
      setConcorsi(json.concorsi ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg || 'Errore nel recupero delle statistiche riffa.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() ?? '';
      if (!ADMIN_EMAILS.includes(email)) {
        router.replace('/');
        return;
      }
      const tok = session?.access_token ?? '';
      setIsAdmin(true);
      await fetchRaffles(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchRaffles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento riffa dashboard...</div>
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
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
            <span className="text-neutral-700">/</span>
            <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-semibold">Ticket & Riffa</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Ticket & <span className="text-red-400 font-semibold">Riffa</span>
          </h1>
          <p className="text-neutral-500 text-sm">Visualizza la distribuzione dei ticket tra gli utenti ed esegui i sorteggi ponderati dei premi finali.</p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}

        {concorsi.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-neutral-400 text-sm">Nessun concorso registrato a cui associare una riffa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {concorsi.map((c) => (
              <div
                key={c.id}
                className={`relative rounded-xl border p-6 transition-all duration-200 ${
                  c.stato === 'attivo'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {c.stato === 'attivo' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Attivo</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">{c.nome}</h2>
                      <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${STATO_COLORS[c.stato]}`}>
                        {STATO_LABELS[c.stato]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-neutral-600 text-[10px] uppercase tracking-wider mb-0.5">Ticket Totali</div>
                        <div className="text-base font-semibold text-white">{c.total_tickets}</div>
                      </div>
                      <div>
                        <div className="text-neutral-600 text-[10px] uppercase tracking-wider mb-0.5">Partecipanti</div>
                        <div className="text-base font-semibold text-white">{c.total_participants}</div>
                      </div>
                      <div>
                        <div className="text-neutral-600 text-[10px] uppercase tracking-wider mb-0.5">Stato Estrazione</div>
                        <div>
                          {c.has_drawn ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              ✓ Completata ({c.winners_count} vincitori)
                            </span>
                          ) : c.total_participants === 0 ? (
                            <span className="text-neutral-600">Nessun ticket distribuito</span>
                          ) : (
                            <span className="text-amber-400 font-semibold animate-pulse">⚡ Da Estrarre</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0">
                    <Link
                      href={`/admin/riffa/${c.id}`}
                      className="w-full md:w-auto text-center text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all"
                    >
                      {c.has_drawn ? '📊 Vedi Risultati' : '🎟️ Gestisci Sorteggio'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
