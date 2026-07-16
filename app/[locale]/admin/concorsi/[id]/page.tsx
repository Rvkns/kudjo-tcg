'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface Stats {
  uniqueUsers: number;
  totalPacks: number;
  totalTickets: number;
}

function toLocalDatetimeString(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmt(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminConcorsoDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const concorsoId = params.id;

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [concorso, setConcorso] = useState<Concorso | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  // Form fields
  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [stato, setStato] = useState<'draft' | 'attivo' | 'concluso'>('draft');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [resetScheduledAt, setResetScheduledAt] = useState('');

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 6000);
  };

  const fetchDetail = useCallback(async (tok: string) => {
    const res = await fetch(`/api/admin/concorsi/${concorsoId}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const json = await res.json();
    if (json.error) return;
    const c: Concorso = json.concorso;
    setConcorso(c);
    setStats(json.stats);
    setNome(c.nome);
    setDescrizione(c.descrizione ?? '');
    setStato(c.stato);
    setDataInizio(toLocalDatetimeString(c.data_inizio));
    setDataFine(toLocalDatetimeString(c.data_fine));
    setResetScheduledAt(toLocalDatetimeString(c.reset_scheduled_at));
  }, [concorsoId]);

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
      await fetchDetail(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchDetail]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, unknown> = {
      nome: nome.trim(),
      descrizione: descrizione.trim() || null,
      stato,
      data_inizio: dataInizio ? new Date(dataInizio).toISOString() : null,
      data_fine: dataFine ? new Date(dataFine).toISOString() : null,
      reset_scheduled_at: resetScheduledAt ? new Date(resetScheduledAt).toISOString() : null,
    };

    const res = await fetch(`/api/admin/concorsi/${concorsoId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);

    if (json.error) {
      showMsg(`✗ Errore: ${json.error}`, 'error');
    } else {
      showMsg('✓ Concorso aggiornato con successo!');
      await fetchDetail(token);
    }
  };

  const handleReset = async () => {
    if (!confirm(`ATTENZIONE: Stai per resettare il concorso "${concorso?.nome}".\n\nVerranno eliminati:\n• Tutte le buste\n• Tutte le carte trovate\n• Tutti i ticket\n\nGli sconti utente sono preservati.\n\nProcedere?`)) return;
    setResetting(true);
    const res = await fetch(`/api/admin/concorsi/${concorsoId}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setResetting(false);
    if (json.success) {
      showMsg(`✓ ${json.message}`);
      await fetchDetail(token);
    } else {
      showMsg(`✗ ${json.error}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento...</div>
      </div>
    );
  }

  if (!concorso) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-red-400 text-sm">Concorso non trovato.</div>
      </div>
    );
  }

  const STATO_COLORS: Record<string, string> = {
    draft: 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30',
    attivo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    concluso: 'bg-neutral-800/40 text-neutral-500 border-neutral-700/30',
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/${locale}/`} className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
            <span className="text-neutral-700">/</span>
            <Link href={`/${locale}/admin`} className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
            <span className="text-neutral-700">/</span>
            <Link href={`/${locale}/admin/concorsi`} className="text-neutral-400 hover:text-white transition-colors">Concorsi</Link>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-semibold truncate max-w-[180px]">{concorso.nome}</span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest border px-2.5 py-1 rounded-full ${STATO_COLORS[concorso.stato]}`}>
            {concorso.stato}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Utenti Partecipanti', value: stats.uniqueUsers, icon: '👥' },
              { label: 'Buste Distribuite', value: stats.totalPacks, icon: '🎴' },
              { label: 'Ticket Totali', value: stats.totalTickets, icon: '🎫' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl font-bold text-white font-mono">{s.value.toLocaleString('it-IT')}</div>
                <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {msg && (
          <div className={`rounded-lg p-4 text-sm border ${msgType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {msg}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest">Informazioni Base</h2>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Nome Concorso</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Descrizione</label>
              <textarea
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                rows={3}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Stato</label>
              <div className="flex gap-3">
                {(['draft', 'attivo', 'concluso'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStato(s)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                      stato === s
                        ? STATO_COLORS[s]
                        : 'bg-transparent border-white/5 text-neutral-600 hover:border-white/15'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest">Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Data Inizio</label>
                <input type="datetime-local" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Data Fine</label>
                <input type="datetime-local" value={dataFine} onChange={(e) => setDataFine(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest mb-1">⏰ Reset Automatico (Cron Job)</h2>
              <p className="text-xs text-neutral-500">
                Il cron job controlla ogni 15 minuti. Imposta data/ora esatta e il sistema resetta automaticamente.
                {concorso.reset_scheduled_at && (
                  <span className="block mt-1 text-amber-400">Attualmente configurato per: {fmt(concorso.reset_scheduled_at)}</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Data Reset Automatico</label>
              <input type="datetime-local" value={resetScheduledAt} onChange={(e) => setResetScheduledAt(e.target.value)}
                className="w-full bg-[#111] border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
          </div>

          <div className="flex gap-4">
            <Link href={`/${locale}/admin/concorsi`}
              className="flex-1 text-center py-3 border border-white/10 rounded-lg text-sm text-neutral-400 hover:border-white/20 transition-all">
              ← Torna alla Lista
            </Link>
            <button type="submit" disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold uppercase tracking-wider py-3 rounded-lg transition-all">
              {saving ? 'Salvataggio...' : '💾 Salva Modifiche'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        {concorso.stato === 'attivo' && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-2">⚠️ Zona Pericolosa</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Il reset manuale elimina immediatamente tutte le buste, carte e ticket del concorso e lo imposta come concluso.
              <strong className="text-neutral-400"> Gli sconti degli utenti NON vengono eliminati.</strong>
            </p>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {resetting ? '⏳ Reset in corso...' : '🔄 Esegui Reset Manuale Ora'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
