'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface CollectionSet {
  id: string;
  concorso_id: string;
  nome: string;
  card_ids: string[];
  sconto_percentuale: number;
  descrizione: string | null;
  created_at: string;
  concorso_nome: string;
  concorso_stato: string;
}

export default function AdminCollectionSetsDashboardPage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [sets, setSets] = useState<CollectionSet[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSets = useCallback(async (tok: string) => {
    setFetchError('');
    try {
      const res = await fetch('/api/admin/collection-sets', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
        return;
      }
      setSets(json.collection_sets ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg || 'Errore nel recupero dei Collection Sets.');
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
      setToken(tok);
      setIsAdmin(true);
      await fetchSets(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchSets]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il Collection Set "${name}"?\n\nQuesta azione non potrà essere annullata.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/collection-sets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setDeletingId(null);
      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }
      await fetchSets(token);
    } catch (err: unknown) {
      setDeletingId(null);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore di rete: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento Collection Sets...</div>
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
            <span className="text-white font-semibold">Collection Sets</span>
          </div>
          <Link
            href="/admin/collection-sets/nuovo"
            className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            <span>＋</span> Nuovo Collection Set
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Gestione <span className="text-blue-400 font-semibold">Collection Sets</span>
          </h1>
          <p className="text-neutral-500 text-sm">Crea e gestisci le sfide di collezione. Gli utenti che completano un set sbloccano un codice sconto permanente.</p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}

        {sets.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <div className="text-5xl mb-4">🎴</div>
            <p className="text-neutral-400 text-sm mb-4">Nessun Collection Set configurato al momento.</p>
            <Link
              href="/admin/collection-sets/nuovo"
              className="inline-block text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition-all shadow-md"
            >
              Crea il Primo Set
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((s) => (
              <div
                key={s.id}
                className="relative rounded-xl border border-white/5 bg-white/[0.02] p-6 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">
                        {s.concorso_nome}
                      </span>
                      <h2 className="text-lg font-semibold text-white">{s.nome}</h2>
                    </div>
                    <span className="shrink-0 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs px-2.5 py-1 rounded-full">
                      -{s.sconto_percentuale}% Sconto
                    </span>
                  </div>

                  {s.descrizione && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {s.descrizione}
                    </p>
                  )}

                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-neutral-500">
                    <span>Carte Richieste:</span>
                    <strong className="text-white">{s.card_ids.length} carte</strong>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-end gap-3">
                  <Link
                    href={`/admin/collection-sets/${s.id}`}
                    className="text-xs text-neutral-300 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded transition-all"
                  >
                    ✏️ Modifica
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id, s.nome)}
                    disabled={deletingId === s.id}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === s.id ? 'Eliminazione...' : '🗑️ Elimina'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
