'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface CardItem {
  id: string;
  numero: number;
  nome: string;
  rarita: 'comune' | 'non_comune' | 'raro';
  elemento: string;
  potere: number;
  descrizione?: string;
  immagine_url?: string;
  is_custom?: boolean;
}

interface PackTierItem {
  tier_key: string;
  nome: string;
  prezzo_eur: number;
  carte_per_busta: number;
  ticket_inclusi: number;
  descrizione: string;
}

const RARITY_BADGES: Record<string, string> = {
  comune: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  non_comune: 'bg-blue-950/60 text-blue-400 border-blue-500/30',
  raro: 'bg-amber-950/60 text-amber-400 border-amber-500/30',
};

const ELEMENT_ICONS: Record<string, string> = {
  Fuoco: '🔥',
  Acqua: '💧',
  Terra: '🪨',
  Ombra: '🌑',
  Fulmine: '⚡',
  Ghiaccio: '❄️',
  Drago: '🐉',
  Luce: '✨',
};

export default function AdminCartePage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<'carte' | 'pacchetti'>('carte');

  // Cards State
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [elementFilter, setElementFilter] = useState('all');

  // Pack Tiers State
  const [packTiers, setPackTiers] = useState<Record<string, PackTierItem>>({});
  const [editingTier, setEditingTier] = useState<PackTierItem | null>(null);
  const [savingTier, setSavingTier] = useState(false);

  const [fetchError, setFetchError] = useState('');

  const fetchCards = useCallback(async (tok: string) => {
    try {
      const res = await fetch('/api/admin/cards', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
        return;
      }
      if (json.cards) {
        setCards(json.cards);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    }
  }, []);

  const fetchPackTiers = useCallback(async (tok: string) => {
    try {
      const res = await fetch('/api/admin/pack-tiers', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.packTiers) {
        setPackTiers(json.packTiers);
      }
    } catch (err: unknown) {
      console.error(err);
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

      await Promise.all([fetchCards(tok), fetchPackTiers(tok)]);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchCards, fetchPackTiers]);

  const handleDeleteCard = async (cardId: string, cardName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la carta "${cardName}" (${cardId})?`)) return;

    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }
      await fetchCards(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore: ${msg}`);
    }
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    setSavingTier(true);

    try {
      const res = await fetch('/api/admin/pack-tiers', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTier),
      });
      const json = await res.json();
      setSavingTier(false);

      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }

      await fetchPackTiers(token);
      setEditingTier(null);
    } catch (err: unknown) {
      setSavingTier(false);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore: ${msg}`);
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchesSearch =
        c.nome.toLowerCase().includes(cardSearch.toLowerCase()) ||
        String(c.numero).includes(cardSearch) ||
        c.id.toLowerCase().includes(cardSearch.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || c.rarita === rarityFilter;
      const matchesElement = elementFilter === 'all' || c.elemento.toLowerCase() === elementFilter.toLowerCase();
      return matchesSearch && matchesRarity && matchesElement;
    });
  }, [cards, cardSearch, rarityFilter, elementFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento Carte TCG & Pacchetti...</div>
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
            <span className="text-white font-semibold">Gestione Carte & Pacchetti</span>
          </div>

          <Link
            href="/admin/carte/nuova"
            className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            <span>＋</span> Nuova Carta TCG
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Gestione <span className="text-cyan-400 font-semibold">Carte TCG & Prezzi Buste</span>
          </h1>
          <p className="text-neutral-500 text-sm">
            Inserisci o aggiorna le carte del gioco, le descrizioni, la grafica ed i prezzi in Euro dei 4 pacchetti di buste digitali.
          </p>
        </div>

        {fetchError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab('carte')}
            className={`px-6 py-3 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'carte'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🃏 Catalogo Carte Kudjo ({cards.length})
          </button>
          <button
            onClick={() => setActiveTab('pacchetti')}
            className={`px-6 py-3 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'pacchetti'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            📦 Prezzi Pacchetti Buste (4 Tier)
          </button>
        </div>

        {/* TAB 1: CARDS MANAGEMENT */}
        {activeTab === 'carte' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Cerca carta per nome, numero o ID..."
                className="bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
              />

              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">Tutte le Rarità</option>
                <option value="comune">Comuni</option>
                <option value="non_comune">Non Comuni</option>
                <option value="raro">Rare</option>
              </select>

              <select
                value={elementFilter}
                onChange={(e) => setElementFilter(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">Tutti gli Elementi</option>
                <option value="Fuoco">🔥 Fuoco</option>
                <option value="Acqua">💧 Acqua</option>
                <option value="Terra">🪨 Terra</option>
                <option value="Ombra">🌑 Ombra</option>
                <option value="Fulmine">⚡ Fulmine</option>
                <option value="Ghiaccio">❄️ Ghiaccio</option>
                <option value="Drago">🐉 Drago</option>
                <option value="Luce">✨ Luce</option>
              </select>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredCards.map((c) => (
                <div
                  key={c.id}
                  className="bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 rounded-xl p-3 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[3/4] w-full rounded-lg bg-neutral-900 overflow-hidden border border-white/5">
                      <Image
                        src={c.immagine_url || `/cards/${c.id}.png`}
                        alt={c.nome}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      <span className="absolute top-1.5 left-1.5 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/10 font-bold">
                        #{c.numero}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white truncate">{c.nome}</h3>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-neutral-400">
                          {ELEMENT_ICONS[c.elemento] || '✨'} {c.elemento}
                        </span>
                        <span className="font-mono text-cyan-400 font-bold">PWR: {c.potere}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${RARITY_BADGES[c.rarita]}`}>
                        {c.rarita.replace('_', ' ')}
                      </span>
                      {c.is_custom && (
                        <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">Custom</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/carte/${c.id}`}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      ✏️ Modifica
                    </Link>
                    {c.is_custom && (
                      <button
                        onClick={() => handleDeleteCard(c.id, c.nome)}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        🗑️ Elimina
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PACK TIERS PRICING MANAGEMENT */}
        {activeTab === 'pacchetti' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(packTiers).map((tier) => (
                <div key={tier.tier_key} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">{tier.nome}</h3>
                      <span className="text-xs text-neutral-500 font-mono uppercase">{tier.tier_key}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-cyan-400">€{tier.prezzo_eur}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">Prezzo Busta</div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">{tier.descrizione}</p>

                  <div className="grid grid-cols-2 gap-4 text-xs bg-white/[0.01] border border-white/5 p-3 rounded-lg">
                    <div>
                      <div className="text-neutral-500 text-[10px] uppercase">Carte Incluse</div>
                      <div className="font-bold text-white">{tier.carte_per_busta} carte</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-[10px] uppercase">Ticket Riffa</div>
                      <div className="font-bold text-amber-400">{tier.ticket_inclusi} ticket</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setEditingTier(tier)}
                      className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      ✏️ Modifica Prezzo & Descrizione
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Edit Tier */}
            {editingTier && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-[#121214] border border-white/10 rounded-xl p-6 max-w-lg w-full space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-base font-semibold text-white">
                      Modifica <span className="text-cyan-400">{editingTier.nome}</span>
                    </h3>
                    <button
                      onClick={() => setEditingTier(null)}
                      className="text-neutral-500 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveTier} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                        Nome Pacchetto
                      </label>
                      <input
                        type="text"
                        value={editingTier.nome}
                        onChange={(e) => setEditingTier({ ...editingTier, nome: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                          Prezzo (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingTier.prezzo_eur}
                          onChange={(e) => setEditingTier({ ...editingTier, prezzo_eur: Number(e.target.value) })}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-cyan-500/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                          Carte / Busta
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editingTier.carte_per_busta}
                          onChange={(e) => setEditingTier({ ...editingTier, carte_per_busta: Number(e.target.value) })}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                          Ticket Riffa
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editingTier.ticket_inclusi}
                          onChange={(e) => setEditingTier({ ...editingTier, ticket_inclusi: Number(e.target.value) })}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                        Descrizione Pacchetto
                      </label>
                      <textarea
                        rows={3}
                        value={editingTier.descrizione}
                        onChange={(e) => setEditingTier({ ...editingTier, descrizione: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setEditingTier(null)}
                        className="text-xs text-neutral-400 hover:text-white px-4 py-2 rounded-lg"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        disabled={savingTier}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
                      >
                        {savingTier ? 'Salvataggio...' : 'Salva Modifiche'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
