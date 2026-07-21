'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface AnalyticsData {
  kpis: {
    estimated_revenue: number;
    total_packs_count: number;
    total_users_count: number;
    total_cards_pulled: number;
    total_tickets: number;
    total_discounts_count: number;
    avg_discount_percent: number;
    total_survey_responses: number;
  };
  tier_breakdown: {
    bronze: { packs: number; revenue: number };
    silver: { packs: number; revenue: number };
    gold: { packs: number; revenue: number };
    platinum: { packs: number; revenue: number };
  };
  hourly_distribution: { hour: string; packs: number }[];
  card_analytics: {
    top_pulled: {
      card_id: string;
      numero: number;
      nome: string;
      rarita: string;
      elemento: string;
      potere: number;
      pull_count: number;
    }[];
    rarest_pulled: {
      card_id: string;
      numero: number;
      nome: string;
      rarita: string;
      elemento: string;
      potere: number;
      pull_count: number;
    }[];
    rarity_distribution: Record<string, number>;
    element_distribution: Record<string, number>;
  };
  top_collectors: {
    email: string;
    full_name: string;
    unique_cards: number;
    total_cards: number;
  }[];
}

const RARITY_COLORS: Record<string, string> = {
  comune: '#888888',
  non_comune: '#3b82f6',
  raro: '#eab308',
};

export default function AdminAnalyticsDashboardPage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchAnalytics = useCallback(async (tok: string) => {
    setFetchError('');
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.error) {
        setFetchError(json.error);
        return;
      }
      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString(locale === 'it' ? 'it-IT' : 'en-US'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg || 'Errore nel recupero dei dati analytics.');
    }
  }, [locale]);

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
      await fetchAnalytics(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchAnalytics]);

  const maxHourlyPacks = useMemo(() => {
    if (!data?.hourly_distribution) return 1;
    return Math.max(...data.hourly_distribution.map(h => h.packs), 1);
  }, [data]);

  const peakHour = useMemo(() => {
    if (!data?.hourly_distribution) return null;
    let max = -1;
    let peak = '';
    data.hourly_distribution.forEach(h => {
      if (h.packs > max) {
        max = h.packs;
        peak = h.hour;
      }
    });
    return { hour: peak, packs: max };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Elaborazione Analytics & KPI...</div>
      </div>
    );
  }

  if (!isAdmin || !data) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-red-400 text-sm">{fetchError || 'Impossibile caricare la dashboard.'}</div>
      </div>
    );
  }

  const { kpis, tier_breakdown, hourly_distribution, card_analytics, top_collectors } = data;

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
            <span className="text-white font-semibold">Analytics & KPI Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              Aggiornato alle: {lastRefreshed}
            </span>
            <button
              onClick={() => fetchAnalytics(token)}
              className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>🔄</span> Aggiorna
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-white mb-2">
            Panoramica <span className="text-cyan-400 font-semibold">Analytics & KPI</span>
          </h1>
          <p className="text-sm text-neutral-400">
            Analisi in tempo reale sul volume di vendite, orari di massimo acquisto, pull rate delle carte, collezioni ed ingaggio utenti.
          </p>
        </div>

        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{fetchError}</div>
        )}

        {/* 1. EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/5 border border-amber-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Fatturato Stimato</div>
            <div className="text-lg font-extrabold text-white">€{kpis.estimated_revenue.toLocaleString()}</div>
            <div className="text-[9px] text-neutral-500">Da vendite buste TCG</div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-900/5 border border-cyan-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Buste Acquistate</div>
            <div className="text-lg font-extrabold text-white">{kpis.total_packs_count}</div>
            <div className="text-[9px] text-neutral-500">Buste totali vendute</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/5 border border-blue-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Utenti Registrati</div>
            <div className="text-lg font-extrabold text-white">{kpis.total_users_count}</div>
            <div className="text-[9px] text-neutral-500">Account piattaforma</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Carte Trovate</div>
            <div className="text-lg font-extrabold text-white">{kpis.total_cards_pulled}</div>
            <div className="text-[9px] text-neutral-500">Presenti nelle collezioni</div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-900/5 border border-red-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Ticket Distribuiti</div>
            <div className="text-lg font-extrabold text-white">{kpis.total_tickets}</div>
            <div className="text-[9px] text-neutral-500">Chances per Riffa</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 border border-emerald-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Sconti Sbloccati</div>
            <div className="text-lg font-extrabold text-white">{kpis.total_discounts_count}</div>
            <div className="text-[9px] text-neutral-500">Media: {kpis.avg_discount_percent}%</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-900/5 border border-indigo-500/20 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Risposte Sondaggi</div>
            <div className="text-lg font-extrabold text-white">{kpis.total_survey_responses}</div>
            <div className="text-[9px] text-neutral-500">Feedback raccolti</div>
          </div>
        </div>

        {/* 2. PACK SALES BREAKDOWN & HOURLY HEATMAP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PACK TIER BREAKDOWN */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>📦</span> Vendite & Rendita per Tier Busta
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Distribuzione delle vendite sui 4 pacchetti TCG disponibili.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Bronze #1 (€5)', data: tier_breakdown.bronze, color: 'bg-amber-700', border: 'border-amber-600/40' },
                { name: 'Silver #2 (€25)', data: tier_breakdown.silver, color: 'bg-slate-400', border: 'border-slate-400/40' },
                { name: 'Gold #3 (€50)', data: tier_breakdown.gold, color: 'bg-amber-400', border: 'border-amber-400/40' },
                { name: 'Platinum #4 (€100)', data: tier_breakdown.platinum, color: 'bg-cyan-400', border: 'border-cyan-400/40' },
              ].map((tier, idx) => {
                const pct = kpis.total_packs_count > 0 ? Math.round((tier.data.packs / kpis.total_packs_count) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-neutral-200">{tier.name}</span>
                      <div className="text-right font-mono">
                        <span className="text-white font-bold">{tier.data.packs} buste</span>
                        <span className="text-neutral-500 ml-2">(€{tier.data.revenue.toLocaleString()})</span>
                      </div>
                    </div>
                    <div className="h-3.5 w-full bg-white/5 rounded-full overflow-hidden flex items-center p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${tier.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-neutral-500 text-right font-mono">{pct}% sul totale vendite</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HOURLY DISTRIBUTION HEATMAP */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>⏰</span> Orari di Maggior Acquisto (Distribuzione 24h)
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Volume di acquisti di buste raggruppati per ora del giorno.</p>
              </div>
              {peakHour && peakHour.packs > 0 && (
                <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                  Picco: {peakHour.hour} ({peakHour.packs} buste)
                </span>
              )}
            </div>

            {/* Bar Chart 24h */}
            <div className="h-44 flex items-end justify-between gap-1 pt-6 px-2">
              {hourly_distribution.map((h, i) => {
                const heightPct = maxHourlyPacks > 0 ? (h.packs / maxHourlyPacks) * 100 : 0;
                const isPeak = peakHour?.hour === h.hour && h.packs > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 bg-black/90 text-white text-[9px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10">
                      {h.hour}: {h.packs} buste
                    </div>

                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isPeak
                          ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                          : h.packs > 0
                          ? 'bg-blue-600/70 group-hover:bg-blue-500'
                          : 'bg-white/5'
                      }`}
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    />
                    <span className="text-[8px] text-neutral-600 font-mono scale-90">{i % 3 === 0 ? h.hour.split(':')[0] : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. CARDS PULL RATE & DROP ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TOP 5 MOST PULLED CARDS */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span>🔥</span> Carte Più Estratte (Top 5)
            </h3>
            <div className="space-y-3">
              {card_analytics.top_pulled.map((card, idx) => (
                <div key={card.card_id} className="flex items-center justify-between text-xs p-2.5 rounded bg-white/[0.01] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-500 font-bold w-4">{idx + 1}.</span>
                    <div>
                      <div className="font-semibold text-white">{card.nome} <span className="text-[10px] text-neutral-500">(#{card.numero})</span></div>
                      <div className="text-[9px] capitalize text-neutral-500" style={{ color: RARITY_COLORS[card.rarita] }}>
                        {card.rarita.replace('_', ' ')} · {card.elemento}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-cyan-400">{card.pull_count}</span>
                    <div className="text-[9px] text-neutral-600">estratte</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP 5 RAREST PULLED CARDS */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span>💎</span> Carte Più Rare Estratte (Top 5)
            </h3>
            <div className="space-y-3">
              {card_analytics.rarest_pulled.map((card, idx) => (
                <div key={card.card_id} className="flex items-center justify-between text-xs p-2.5 rounded bg-white/[0.01] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-500 font-bold w-4">{idx + 1}.</span>
                    <div>
                      <div className="font-semibold text-white">{card.nome} <span className="text-[10px] text-neutral-500">(#{card.numero})</span></div>
                      <div className="text-[9px] capitalize font-semibold" style={{ color: RARITY_COLORS[card.rarita] }}>
                        {card.rarita.replace('_', ' ')} · {card.elemento}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-400">{card.pull_count}</span>
                    <div className="text-[9px] text-neutral-600">estratte</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RARITY DISTRIBUTION */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span>📊</span> Distribuzione per Rarità
            </h3>

            <div className="space-y-4 pt-2">
              {[
                { label: 'Comuni (C)', key: 'comune', color: 'bg-neutral-500', hex: '#888888' },
                { label: 'Non Comuni (NC)', key: 'non_comune', color: 'bg-blue-500', hex: '#3b82f6' },
                { label: 'Rare (R)', key: 'raro', color: 'bg-amber-400', hex: '#eab308' },
              ].map(r => {
                const count = card_analytics.rarity_distribution[r.key] || 0;
                const pct = kpis.total_cards_pulled > 0 ? Math.round((count / kpis.total_cards_pulled) * 100) : 0;
                return (
                  <div key={r.key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold" style={{ color: r.hex }}>{r.label}</span>
                      <span className="font-mono text-white font-bold">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. TOP COLLECTORS LEADERBOARD */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>🏆</span> Classifica Top Collezionisti Kudjo TCG
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Gli utenti che hanno raccolto il maggior numero di carte uniche nello specifico set.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-neutral-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Posizione</th>
                  <th className="py-3 px-4 font-semibold">Utente</th>
                  <th className="py-3 px-4 font-semibold">Carte Uniche</th>
                  <th className="py-3 px-4 font-semibold">Carte Totali Pulled</th>
                  <th className="py-3 px-4 font-semibold">% Collezione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {top_collectors.map((c, idx) => {
                  const pct = Math.round((c.unique_cards / 55) * 100);
                  return (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-400 font-mono">#{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{c.full_name}</div>
                        <div className="text-neutral-500 text-[11px]">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-cyan-400">
                        {c.unique_cards} / 55
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300 font-mono">
                        {c.total_cards} carte
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-neutral-400 text-[10px]">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
