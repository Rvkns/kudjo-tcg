'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';


interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  response_count: number;
}

const STATO_COLORS: Record<string, string> = {
  draft: 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30',
  published: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  archived: 'bg-neutral-800/40 text-neutral-500 border-neutral-700/30',
};

const STATO_LABELS: Record<string, string> = {
  draft: 'ðŸ“‹ Bozza',
  published: 'ðŸŸ¢ Pubblicato',
  archived: 'â›” Archiviato',
};

function fmt(dt: string | null) {
  if (!dt) return 'â€”';
  return new Date(dt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminSondaggiPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [fetchError, setFetchError] = useState('');

  const fetchSurveys = useCallback(async (tok: string) => {
    setFetchError('');
    try {
      const res = await fetch('/api/admin/surveys', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
        return;
      }
      setSurveys(json.surveys ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg || 'Errore nel recupero dei sondaggi.');
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
      await fetchSurveys(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchSurveys]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il sondaggio "${title}"?\n\nQuesta operazione cancellerÃ  permanentemente tutte le domande e le risposte raccolte.`)) return;

    try {
      const res = await fetch(`/api/admin/surveys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }
      await fetchSurveys(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore: ${msg}`);
    }
  };

  const handleToggleStatus = async (s: Survey) => {
    const newStatus = s.status === 'draft' ? 'published' : s.status === 'published' ? 'archived' : 'draft';
    try {
      const res = await fetch(`/api/admin/surveys/${s.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }
      await fetchSurveys(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento sondaggi...</div>
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
            <span className="text-white font-semibold">Sondaggi</span>
          </div>
          <Link
            href="/admin/sondaggi/nuovo"
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-lg transition-all duration-200"
          >
            + Nuovo Sondaggio
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">Gestione <span className="text-purple-400 font-semibold">Sondaggi</span></h1>
          <p className="text-neutral-500 text-sm">Crea, rilascia e analizza i sondaggi di gradimento e le indagini per gli utenti.</p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}

        {surveys.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <div className="text-5xl mb-4">ðŸ“Š</div>
            <p className="text-neutral-400 text-sm mb-6">Nessun sondaggio trovato. Crea il primo sondaggio per i tuoi utenti!</p>
            <Link
              href="/admin/sondaggi/nuovo"
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-lg transition-all"
            >
              + Crea Primo Sondaggio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {surveys.map((s) => (
              <div
                key={s.id}
                className={`relative rounded-xl border p-6 transition-all duration-200 ${
                  s.status === 'published'
                    ? 'border-purple-500/30 bg-purple-500/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {s.status === 'published' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Attivo</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                      <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${STATO_COLORS[s.status]}`}>
                        {STATO_LABELS[s.status]}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-sm text-neutral-400 mb-3">{s.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-500">
                      <div>
                        <span className="text-neutral-600">Creato il:</span> {fmt(s.created_at)}
                      </div>
                      <div>
                        <span className="text-neutral-600">Risposte totali:</span> <span className="text-purple-400 font-semibold">{s.response_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Link
                      href={`/admin/sondaggi/${s.id}`}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-500/50 px-4 py-2 rounded-lg transition-all text-center"
                    >
                      ðŸ“ˆ Risposte & Statistiche
                    </Link>

                    <button
                      onClick={() => handleToggleStatus(s)}
                      className={`text-xs font-semibold border px-4 py-2 rounded-lg transition-all ${
                        s.status === 'draft'
                          ? 'text-purple-400 border-purple-500/30 hover:border-purple-500/50'
                          : s.status === 'published'
                          ? 'text-neutral-400 border-neutral-600/30 hover:border-neutral-500/50'
                          : 'text-neutral-500 border-neutral-700/30 hover:border-neutral-600/50'
                      }`}
                    >
                      {s.status === 'draft' ? 'â–¶ Pubblica' : s.status === 'published' ? 'â¹ Archivia' : 'ðŸ”„ Rendi Bozza'}
                    </button>

                    <button
                      onClick={() => handleDelete(s.id, s.title)}
                      className="text-xs font-semibold text-red-400 border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all"
                    >
                      ðŸ—‘ï¸ Elimina
                    </button>
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
