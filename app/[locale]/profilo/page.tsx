'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  kudjoCards,
  getUserCollection,
  getPendingPacks,
  getTotalPendingPacks,
  MILESTONES,
  getCardById,
  type Milestone,
} from '@/lib/data/kudjo-cards-db';
import { type KudjoCard as KudjoCardType, type KudjoCardRarita } from '@/lib/schema/kudjo-card';
import KudjoCard from '@/app/components/KudjoCard';
import PackOpeningModal from '@/app/components/PackOpeningModal';

// ─── Rarity filter options ─────────────────────────────────────────────────
type FilterRarita = 'all' | KudjoCardRarita;

const TIER_NAMES: Record<string, { it: string; en: string }> = {
  bronze:   { it: 'Bronze #1',   en: 'Bronze #1'   },
  silver:   { it: 'Silver #2',   en: 'Silver #2'   },
  gold:     { it: 'Gold #3',     en: 'Gold #3'     },
  platinum: { it: 'Platinum #4', en: 'Platinum #4' },
};

const RARITY_COLORS: Record<string, string> = {
  comune:     '#888888',
  non_comune: '#7ab8e8',
  raro:       '#dfae0b',
};

export default function ProfiloPage() {
  const t    = useTranslations('Profilo');
  const locale = useLocale();
  const isIt = locale === 'it';

  // ── State ──────────────────────────────────────────────────────────────
  const [collection, setCollection]       = useState<ReturnType<typeof getUserCollection>>([]);
  const [pendingPacks, setPendingPacks]   = useState<ReturnType<typeof getPendingPacks>>([]);
  const [totalPacks, setTotalPacks]       = useState(0);
  const [filterRarita, setFilterRarita]   = useState<FilterRarita>('all');
  const [selectedTier, setSelectedTier]   = useState<string>('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [hydrated, setHydrated]           = useState(false);

  const refreshState = () => {
    const col   = getUserCollection();
    const packs = getPendingPacks();
    setCollection(col);
    setPendingPacks(packs);
    setTotalPacks(getTotalPendingPacks());
    // Auto-select first available tier
    if (packs.length > 0 && !selectedTier) {
      setSelectedTier(packs[0].tier);
    }
  };

  useEffect(() => {
    refreshState();
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────

  // Map cardId → count (for duplicates)
  const countMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const inst of collection) {
      map[inst.cardId] = (map[inst.cardId] ?? 0) + 1;
    }
    return map;
  }, [collection]);

  // Unique cards found
  const uniqueCardIds   = useMemo(() => Object.keys(countMap), [countMap]);
  const uniqueCards     = useMemo<KudjoCardType[]>(() =>
    uniqueCardIds.map(id => getCardById(id)).filter(Boolean) as KudjoCardType[],
    [uniqueCardIds]
  );

  // Filtered cards
  const filteredCards = useMemo<KudjoCardType[]>(() => {
    if (filterRarita === 'all') return uniqueCards.sort((a, b) => a.numero - b.numero);
    return uniqueCards.filter(c => c.rarita === filterRarita).sort((a, b) => a.numero - b.numero);
  }, [uniqueCards, filterRarita]);

  // Milestones
  const unlockedMilestones = useMemo<Set<string>>(
    () => new Set(MILESTONES.filter(m => uniqueCardIds.length >= m.threshold).map(m => m.id)),
    [uniqueCardIds.length]
  );

  // Progress %
  const progressPct = Math.min(100, Math.round((uniqueCardIds.length / 55) * 100));

  // Selected pack for modal
  const selectedPackData = pendingPacks.find(p => p.tier === selectedTier);
  const selectedPackName = selectedTier ? (isIt ? TIER_NAMES[selectedTier]?.it : TIER_NAMES[selectedTier]?.en) ?? selectedTier : '';

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans animate-page-entry">
      {/* Decorative glows */}
      <div className="absolute top-20 left-1/4 h-[400px] w-[400px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 h-[500px] w-[500px] rounded-full bg-bronze/3 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16 space-y-16">

        {/* ── HERO ── */}
        <section>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-bronze/35 bg-bronze/5 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-bronze mb-4">
            🎴 Kudjo Original Set I
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light leading-tight">
            {t('title')}
          </h1>
          <p className="mt-3 text-neutral-400 text-sm max-w-xl">{t('subtitle')}</p>
        </section>

        {/* ── PACK OPENER WIDGET ── */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-xl text-foreground font-light mb-1">
                {t('pendingPacks')}
              </h2>
              <p className="text-neutral-400 text-xs">
                {totalPacks > 0
                  ? isIt
                    ? `Hai ${totalPacks} bust${totalPacks === 1 ? 'a' : 'e'} da aprire`
                    : `You have ${totalPacks} pack${totalPacks === 1 ? '' : 's'} to open`
                  : t('noPacks')
                }
              </p>
            </div>

            {totalPacks > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                {/* Tier selector */}
                <div className="flex flex-wrap gap-2">
                  {pendingPacks.map(pp => (
                    <button
                      key={pp.tier}
                      onClick={() => setSelectedTier(pp.tier)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                        selectedTier === pp.tier
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-[#121214] border-white/10 text-neutral-300 hover:border-white/25'
                      }`}
                    >
                      {isIt ? TIER_NAMES[pp.tier]?.it : TIER_NAMES[pp.tier]?.en}
                      <span className="ml-2 text-[10px] opacity-70">×{pp.quantity}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { if (selectedTier) setModalOpen(true); }}
                  disabled={!selectedTier}
                  className="bg-[#e11b22] hover:bg-red-700 disabled:opacity-40 text-white py-2.5 px-6 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer shadow-[0_4px_20px_rgba(225,27,34,0.15)] flex items-center gap-2"
                >
                  <span>🎴</span>
                  <span>{t('openPacks')}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/concorso"
                className="rounded border border-bronze bg-bronze/10 px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase text-bronze transition-all hover:bg-bronze hover:text-[#0b0b0c]"
              >
                {t('goToContest')} →
              </Link>
            )}
          </div>
        </section>

        {/* ── PROGRESS BAR ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-foreground font-light">{t('collectionProgress')}</h2>
            <span className="font-mono text-sm text-bronze font-semibold">
              {uniqueCardIds.length}<span className="text-neutral-500">/55</span>
            </span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #dfae0b, #e11b22)',
                boxShadow: '0 0 10px rgba(223,174,11,0.3)',
              }}
            />
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-neutral-500 uppercase tracking-widest">
            <span>{collection.length} {t('cardsFound')}</span>
            <span>{uniqueCardIds.length} {t('uniqueCards')} · {t('totalCards')}</span>
          </div>
        </section>

        {/* ── MILESTONES ── */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-xl text-foreground font-light mb-1">{t('milestones')}</h2>
            <p className="text-neutral-500 text-xs">{t('milestonesDesc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MILESTONES.map((m: Milestone) => {
              const unlocked = unlockedMilestones.has(m.id);
              const remaining = Math.max(0, m.threshold - uniqueCardIds.length);
              return (
                <div
                  key={m.id}
                  className={`relative rounded-xl border p-4 transition-all ${
                    unlocked
                      ? 'border-bronze/40 bg-bronze/5 shadow-[0_0_15px_rgba(223,174,11,0.08)]'
                      : 'border-white/5 bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-2xl ${unlocked ? '' : 'opacity-30'}`}>{m.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold tracking-wider uppercase ${unlocked ? 'text-bronze' : 'text-neutral-500'}`}>
                          {isIt ? m.labelIt : m.labelEn}
                        </span>
                        {unlocked ? (
                          <span className="text-[8px] font-bold tracking-widest bg-bronze/20 text-bronze px-2 py-0.5 rounded border border-bronze/30">
                            {t('milestoneUnlocked')}
                          </span>
                        ) : (
                          <span className="text-[8px] text-neutral-600 font-mono">
                            {remaining > 0 ? t('milestoneLocked').replace('{n}', String(remaining)) : ''}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 ${unlocked ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        🎁 {isIt ? m.rewardIt : m.rewardEn}
                      </p>
                      {/* Mini progress bar */}
                      {!unlocked && (
                        <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-neutral-600"
                            style={{ width: `${Math.min(100, (uniqueCardIds.length / m.threshold) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── DIGITAL COLLECTION ── */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-foreground font-light">{t('digitalCollection')}</h2>
              <p className="text-neutral-500 text-xs mt-1">{t('digitalCollectionDesc')}</p>
            </div>

            {/* Rarity filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'comune', 'non_comune', 'raro'] as FilterRarita[]).map(f => {
                const labels: Record<FilterRarita, string> = {
                  all:        t('filterAll'),
                  comune:     t('filterComune'),
                  non_comune: t('filterNonComune'),
                  raro:       t('filterRaro'),
                };
                const isActive = filterRarita === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilterRarita(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-[#121214] border-white/5 text-neutral-400 hover:border-white/20'
                    }`}
                    style={isActive && f !== 'all' ? { color: RARITY_COLORS[f] || '#f2ede4', background: RARITY_COLORS[f] ? RARITY_COLORS[f] + '20' : undefined, borderColor: RARITY_COLORS[f] ? RARITY_COLORS[f] + '60' : undefined } : {}}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Not-yet-found cards greyed out / found cards full color */}
          {uniqueCardIds.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 text-sm">
              <div className="text-4xl mb-4">🎴</div>
              <p>{t('emptyCollection')}</p>
              <Link href="/concorso" className="mt-4 inline-block text-bronze hover:text-foreground transition-colors text-xs uppercase tracking-widest font-bold">
                {t('goToContest')} →
              </Link>
            </div>
          ) : (
            <>
              {/* Found cards */}
              {filteredCards.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {filteredCards.map(card => (
                    <div key={card.id} className="flex flex-col items-center gap-1.5">
                      <KudjoCard card={card} size="normal" duplicates={countMap[card.id]} />
                      {countMap[card.id] > 1 && (
                        <span className="text-[8px] text-neutral-500 uppercase tracking-widest">
                          {t('duplicatesLabel').replace('{n}', String(countMap[card.id]))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Not yet found section */}
              {filterRarita === 'all' && uniqueCardIds.length < 55 && (
                <div>
                  <div className="border-t border-white/5 pt-6 mb-4">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                      {isIt ? `Non ancora trovate (${55 - uniqueCardIds.length})` : `Not found yet (${55 - uniqueCardIds.length})`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 opacity-20">
                    {kudjoCards
                      .filter(c => !countMap[c.id])
                      .slice(0, 20)
                      .map(card => (
                        <KudjoCard key={card.id} card={card} size="normal" faceDown />
                      ))}
                    {kudjoCards.filter(c => !countMap[c.id]).length > 20 && (
                      <div className="flex items-center justify-center w-[160px] h-[224px] rounded-lg bg-white/5 border border-white/5 text-neutral-600 text-xs font-mono">
                        +{kudjoCards.filter(c => !countMap[c.id]).length - 20} {isIt ? 'altre' : 'more'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Pack Opening Modal */}
      {modalOpen && selectedPackData && (
        <PackOpeningModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          packTier={selectedTier}
          packName={selectedPackName}
          availablePacks={selectedPackData.quantity}
          onPackOpened={() => refreshState()}
        />
      )}
    </div>
  );
}
