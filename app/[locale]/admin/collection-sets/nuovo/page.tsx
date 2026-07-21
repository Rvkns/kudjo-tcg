'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { kudjoCards } from '@/lib/data/kudjo-cards-db';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface Concorso {
  id: string;
  nome: string;
  stato: string;
}

const ELEMENTI = ['tutti', 'fuoco', 'acqua', 'terra', 'ombra', 'fulmine', 'ghiaccio', 'drago', 'luce'];

export default function AdminNuovoCollectionSetPage() {
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [concorsi, setConcorsi] = useState<Concorso[]>([]);
  const [selectedConcorsoId, setSelectedConcorsoId] = useState('');
  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [scontoPercentuale, setScontoPercentuale] = useState(15);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [elementFilter, setElementFilter] = useState('tutti');

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

      // Fetch available concorsi
      try {
        const res = await fetch('/api/admin/concorsi', {
          headers: { Authorization: `Bearer ${tok}` }
        });
        const json = await res.json();
        if (json.concorsi && json.concorsi.length > 0) {
          setConcorsi(json.concorsi);
          setSelectedConcorsoId(json.concorsi[0].id);
        }
      } catch (err: unknown) {
        console.error(err);
      }
      setLoading(false);
    };
    init();
  }, [locale, router]);

  const toggleCardSelection = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
    } else {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const handleSelectAllInFilter = () => {
    const filtered = kudjoCards.filter(c => elementFilter === 'tutti' || c.elemento === elementFilter);
    const filterIds = filtered.map(c => c.id);
    const newSelection = Array.from(new Set([...selectedCardIds, ...filterIds]));
    setSelectedCardIds(newSelection);
  };

  const handleDeselectAllInFilter = () => {
    const filtered = kudjoCards.filter(c => elementFilter === 'tutti' || c.elemento === elementFilter);
    const filterIds = new Set(filtered.map(c => c.id));
    setSelectedCardIds(selectedCardIds.filter(id => !filterIds.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedConcorsoId) {
      setErrorMsg('Devi selezionare un concorso a cui associare il set.');
      return;
    }
    if (!nome.trim()) {
      setErrorMsg('Il nome del Collection Set è obbligatorio.');
      return;
    }
    if (selectedCardIds.length === 0) {
      setErrorMsg('Devi selezionare almeno una carta richiesta per completare il set.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/collection-sets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          concorso_id: selectedConcorsoId,
          nome: nome.trim(),
          descrizione: descrizione.trim() || null,
          sconto_percentuale: scontoPercentuale,
          card_ids: selectedCardIds
        })
      });
      const json = await res.json();
      setSaving(false);

      if (json.error) {
        setErrorMsg(json.error);
        return;
      }

      router.push('/admin/collection-sets');
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Errore durante la creazione del set.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento...</div>
      </div>
    );
  }

  const filteredCards = kudjoCards.filter(c => elementFilter === 'tutti' || c.elemento === elementFilter);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin/collection-sets" className="text-neutral-400 hover:text-white transition-colors">Collection Sets</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold">Nuovo Set</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Crea Nuovo <span className="text-blue-400 font-semibold">Collection Set</span>
          </h1>
          <p className="text-neutral-500 text-sm">Definisci il nome, la percentuale di sconto e seleziona le carte che compongono il set.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main attributes */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  Concorso Associato *
                </label>
                <select
                  value={selectedConcorsoId}
                  onChange={(e) => setSelectedConcorsoId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  required
                >
                  {concorsi.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.stato})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  Percentuale Sconto (%) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={scontoPercentuale}
                  onChange={(e) => setScontoPercentuale(Number(e.target.value))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Nome Collection Set *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="es. Collezione Elementale Fuoco"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Descrizione (Opzionale)
              </label>
              <textarea
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                rows={2}
                placeholder="es. Colleziona tutte le carte di tipo Fuoco per sbloccare il 15% di sconto sul tuo prossimo acquisto."
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>
          </div>

          {/* Interactive Card Selector */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>🃏</span> Selezione Carte del Set ({selectedCardIds.length} selezionate)
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Clicca sulle carte per aggiungerle o rimuoverle dal set.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllInFilter}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded transition-all cursor-pointer"
                >
                  ✓ Seleziona Filtrate
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllInFilter}
                  className="text-xs text-neutral-400 hover:text-white border border-white/10 px-3 py-1.5 rounded transition-all cursor-pointer"
                >
                  ✕ Deseleziona Filtrate
                </button>
              </div>
            </div>

            {/* Element Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {ELEMENTI.map(elem => (
                <button
                  key={elem}
                  type="button"
                  onClick={() => setElementFilter(elem)}
                  className={`text-xs font-bold capitalize px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    elementFilter === elem
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  {elem}
                </button>
              ))}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredCards.map((card) => {
                const isSelected = selectedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleCardSelection(card.id)}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                        : 'bg-white/[0.01] border-white/5 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">
                        ✓
                      </div>
                    )}
                    <div className="text-[10px] font-mono text-neutral-500 mb-1">#{card.numero}</div>
                    <div className="text-xs font-semibold truncate text-white mb-1">{card.nome}</div>
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-neutral-500">
                      <span>{card.elemento}</span>
                      <span className="font-bold text-blue-400">Pwr {card.potere}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/collection-sets"
              className="text-xs text-neutral-400 hover:text-white px-5 py-3 rounded-lg transition-colors"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Crea Collection Set'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
