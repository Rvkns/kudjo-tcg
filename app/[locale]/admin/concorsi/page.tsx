'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface Concorso {
  id: string;
  nome: string;
  descrizione: string | null;
  stato: 'draft' | 'attivo' | 'concluso';
  data_inizio: string | null;
  data_fine: string | null;
  reset_scheduled_at: string | null;
  created_at: string;
}

const STATO_COLORS: Record<string, string> = {
  draft:    'bg-neutral-700/40 text-neutral-400 border-neutral-600/30',
  attivo:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  concluso: 'bg-neutral-800/40 text-neutral-500 border-neutral-700/30',
};

const STATO_LABELS: Record<string, string> = {
  draft: '📋 Bozza',
  attivo: '🟢 Attivo',
  concluso: '⛔ Concluso',
};

function fmt(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminConcorsiPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [concorsi, setConcorsi] = useState<Concorso[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState('');

  const fetchConcorsi = useCallback(async (tok: string) => {
    setFetchError('');
    const res = await fetch('/api/admin/concorsi', {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const json = await res.json();
    if (json.error) { setFetchError(json.error); return; }
    setConcorsi(json.concorsi ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() ?? '';
      if (!ADMIN_EMAILS.includes(email)) {
        router.replace(`/${locale}/`);
        return;
      }
      const tok = session?.access_token ?? '';
      setToken(tok);
      setIsAdmin(true);
      await fetchConcorsi(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchConcorsi]);

  const handleReset = async (c: Concorso) => {
    if (!confirm(`Sei sicuro di voler resettare e concludere "${c.nome}"?\n\nQuesta operazione:\n• Elimina tutte le buste del concorso\n• Elimina tutte le carte trovate\n• Elimina tutti i ticket\n• Imposta il concorso come "Concluso"\n\nGli sconti degli utenti vengono preservati.`)) return;
    setResettingId(c.id);
    setResetMsg('');
    const res = await fetch(`/api/admin/concorsi/${c.id}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setResettingId(null);
    if (json.success) {
      setResetMsg(`✓ ${json.message}`);
      await fetchConcorsi(token);
    } else {
      setResetMsg(`✗ Errore: ${json.error}`);
    }
    setTimeout(() => setResetMsg(''), 6000);
  };

  const handleToggleStato = async (c: Concorso) => {
    const newStato = c.stato === 'draft' ? 'attivo' : c.stato === 'attivo' ? 'concluso' : 'draft';
    const res = await fetch(`/api/admin/concorsi/${c.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato: newStato }),
    });
    const json = await res.json();
    if (json.error) {
      alert(`Errore: ${json.error}`);
      return;
    }
    await fetchConcorsi(token);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento concorsi...</div>
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
            <Link href={`/${locale}/`} className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
            <span className="text-neutral-700">/</span>
            <Link href={`/${locale}/admin`} className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-semibold">Concorsi</span>
          </div>
          <Link
            href={`/${locale}/admin/concorsi/nuovo`}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-lg transition-all duration-200"
          >
            + Nuovo Concorso
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">Gestione <span className="text-amber-400 font-semibold">Concorsi</span></h1>
          <p className="text-neutral-500 text-sm">Crea e gestisci i concorsi TCG digitali. Solo un concorso può essere attivo alla volta.</p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}
        {resetMsg && (
          <div className={`mb-6 rounded-lg p-4 text-sm border ${resetMsg.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {resetMsg}
          </div>
        )}

        {concorsi.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-neutral-400 text-sm mb-6">Nessun concorso trovato. Crea il primo concorso!</p>
            <Link
              href={`/${locale}/admin/concorsi/nuovo`}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-lg transition-all"
            >
              + Crea Primo Concorso
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {concorsi.map((c) => (
              <div
                key={c.id}
                className={`relative rounded-xl border p-6 transition-all duration-200 ${
                  c.stato === 'attivo'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {c.stato === 'attivo' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-white">{c.nome}</h2>
                      <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${STATO_COLORS[c.stato]}`}>
                        {STATO_LABELS[c.stato]}
                      </span>
                    </div>
                    {c.descrizione && (
                      <p className="text-sm text-neutral-400 mb-3">{c.descrizione}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-neutral-500">
                      <div>
                        <div className="text-neutral-600 uppercase tracking-wider text-[9px] mb-0.5">Inizio</div>
                        <div>{fmt(c.data_inizio)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-600 uppercase tracking-wider text-[9px] mb-0.5">Fine</div>
                        <div>{fmt(c.data_fine)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-600 uppercase tracking-wider text-[9px] mb-0.5">Reset Automatico</div>
                        <div className={c.reset_scheduled_at ? 'text-amber-400' : ''}>{fmt(c.reset_scheduled_at)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    <Link
                      href={`/${locale}/admin/concorsi/${c.id}`}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 px-4 py-2 rounded-lg transition-all text-center"
                    >
                      ✏️ Gestisci
                    </Link>

                    {c.stato !== 'concluso' && (
                      <button
                        onClick={() => handleToggleStato(c)}
                        className={`text-xs font-semibold border px-4 py-2 rounded-lg transition-all ${
                          c.stato === 'draft'
                            ? 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'text-neutral-400 border-neutral-600/30 hover:border-neutral-500/50'
                        }`}
                      >
                        {c.stato === 'draft' ? '▶ Attiva' : '⏸ Concludi'}
                      </button>
                    )}

                    {c.stato === 'attivo' && (
                      <button
                        onClick={() => handleReset(c)}
                        disabled={resettingId === c.id}
                        className="text-xs font-semibold text-red-400 border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                      >
                        {resettingId === c.id ? '⏳ Reset...' : '🔄 Reset Ora'}
                      </button>
                    )}
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
