'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

export default function NuovoConcorsoPage() {
  const locale = useLocale();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [stato, setStato] = useState<'draft' | 'attivo'>('draft');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [resetScheduledAt, setResetScheduledAt] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() ?? '';
      if (!ADMIN_EMAILS.includes(email)) {
        router.replace(`/${locale}/`);
        return;
      }
      setToken(session?.access_token ?? '');
      setLoading(false);
    };
    init();
  }, [locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Il nome del concorso è obbligatorio.'); return; }
    setSaving(true);
    setError('');

    const body: Record<string, unknown> = { nome: nome.trim(), descrizione: descrizione.trim() || null, stato };
    if (dataInizio) body.data_inizio = new Date(dataInizio).toISOString();
    if (dataFine) body.data_fine = new Date(dataFine).toISOString();
    if (resetScheduledAt) body.reset_scheduled_at = new Date(resetScheduledAt).toISOString();

    const res = await fetch('/api/admin/concorsi', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setSaving(false);

    if (json.error) {
      setError(json.error);
      return;
    }

    router.push(`/${locale}/admin/concorsi/${json.concorso.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href={`/${locale}/`} className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
          <span className="text-neutral-700">/</span>
          <Link href={`/${locale}/admin`} className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
          <span className="text-neutral-700">/</span>
          <Link href={`/${locale}/admin/concorsi`} className="text-neutral-400 hover:text-white transition-colors">Concorsi</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold">Nuovo</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Nuovo <span className="text-amber-400 font-semibold">Concorso</span>
          </h1>
          <p className="text-neutral-500 text-sm">Compila i dettagli del nuovo concorso TCG.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{error}</div>
          )}

          {/* Nome */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest">Informazioni Base</h2>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Nome Concorso *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="es. Concorso Estate 2026"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Descrizione</label>
              <textarea
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Descrizione opzionale del concorso..."
                rows={3}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Stato Iniziale</label>
              <div className="flex gap-3">
                {(['draft', 'attivo'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStato(s)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                      stato === s
                        ? s === 'attivo'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-neutral-700/40 border-neutral-500/50 text-neutral-300'
                        : 'bg-transparent border-white/5 text-neutral-500 hover:border-white/20'
                    }`}
                  >
                    {s === 'draft' ? '📋 Bozza' : '🟢 Attivo'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest">Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Data Inizio</label>
                <input
                  type="datetime-local"
                  value={dataInizio}
                  onChange={(e) => setDataInizio(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Data Fine</label>
                <input
                  type="datetime-local"
                  value={dataFine}
                  onChange={(e) => setDataFine(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Reset automatico */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest mb-1">⏰ Reset Automatico</h2>
              <p className="text-xs text-neutral-500">
                Imposta la data/ora in cui il cron job (ogni 15 minuti) dovrà resettare automaticamente il concorso.
                Lascia vuoto per gestire il reset manualmente.
              </p>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Data Reset Automatico</label>
              <input
                type="datetime-local"
                value={resetScheduledAt}
                onChange={(e) => setResetScheduledAt(e.target.value)}
                className="w-full bg-[#111] border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/admin/concorsi`}
              className="flex-1 text-center py-3 border border-white/10 rounded-lg text-sm text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold uppercase tracking-wider py-3 rounded-lg transition-all"
            >
              {saving ? 'Creazione...' : 'Crea Concorso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
