'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  kudjoCards,
  getUserCollection,
  getPendingPacks,
  MILESTONES,
  getCardById,
  syncLocalToCloud,
  type Milestone,
  getUserTickets,
} from '@/lib/data/kudjo-cards-db';
import { type KudjoCard as KudjoCardType, type KudjoCardRarita, type KudjoCardInstance, type KudjoPendingPack } from '@/lib/schema/kudjo-card';
import KudjoCard from '@/app/components/KudjoCard';
import PackOpeningModal from '@/app/components/PackOpeningModal';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

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

  // ── Auth State ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // ── TCG Collection State ────────────────────────────────────────────────
  const [collection, setCollection]       = useState<KudjoCardInstance[]>([]);
  const [pendingPacks, setPendingPacks]   = useState<KudjoPendingPack[]>([]);
  const [totalPacks, setTotalPacks]       = useState(0);
  const [userTickets, setUserTickets]     = useState(0);
  const [filterRarita, setFilterRarita]   = useState<FilterRarita>('all');
  const [selectedTier, setSelectedTier]   = useState<string>('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [hydrated, setHydrated]           = useState(false);

  interface UserCollectionSetProgress {
    id: string;
    concorso_id: string;
    concorso_nome: string;
    concorso_stato: string;
    nome: string;
    descrizione: string | null;
    sconto_percentuale: number;
    card_ids: string[];
    owned_card_ids: string[];
    missing_card_ids: string[];
    owned_count: number;
    total_count: number;
    progress_percentage: number;
    is_completed: boolean;
    claimed_discount: {
      code: string;
      sconto_percentuale: number;
      created_at: string;
    } | null;
  }

  const [collectionSets, setCollectionSets] = useState<UserCollectionSetProgress[]>([]);
  const [claimingSetId, setClaimingSetId]   = useState<string | null>(null);
  const [copiedCode, setCopiedCode]         = useState<string | null>(null);

  const fetchCollectionSets = async (tok?: string) => {
    try {
      const accessToken = tok || (await supabase.auth.getSession()).data.session?.access_token;
      if (!accessToken) return;
      const res = await fetch('/api/collection-sets/user-progress', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const json = await res.json();
      if (json.sets) {
        setCollectionSets(json.sets);
      }
    } catch (err) {
      console.error('Error fetching collection sets:', err);
    }
  };

  const refreshState = async () => {
    try {
      const col   = await getUserCollection();
      const rawPacks = await getPendingPacks();
      const packs = rawPacks.filter(p => p.quantity > 0);
      const tix   = await getUserTickets();
      setCollection(col);
      setPendingPacks(packs);
      setUserTickets(tix);
      const total = packs.reduce((sum, p) => sum + p.quantity, 0);
      setTotalPacks(total);
      
      // Auto-select first available tier if none selected or selected tier no longer available
      if (packs.length > 0) {
        setSelectedTier((prev) => {
          if (prev && packs.some(p => p.tier === prev)) return prev;
          return packs[0].tier;
        });
      } else {
        setSelectedTier('');
      }
      await fetchCollectionSets();
    } catch (err) {
      console.error('Error refreshing state:', err);
    }
  };

  const handleClaimDiscount = async (setId: string) => {
    setClaimingSetId(setId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch('/api/collection-sets/claim-discount', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collection_set_id: setId })
      });
      const json = await res.json();
      setClaimingSetId(null);
      if (json.error) {
        alert(json.error);
        return;
      }
      await fetchCollectionSets(session.access_token);
    } catch (err) {
      setClaimingSetId(null);
      console.error('Error claiming discount:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  useEffect(() => {
    const checkUserAndSync = async () => {
      setLoadingAuth(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Sync localStorage data to Supabase cloud upon loading
          await syncLocalToCloud(session.user.id);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoadingAuth(false);
      }
      
      await refreshState();
      setHydrated(true);
    };

    checkUserAndSync();

    // Listen for auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await syncLocalToCloud(session.user.id);
      } else {
        setUser(null);
      }
      await refreshState();
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/' + locale + '/profilo',
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      await refreshState();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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

  if (!loadingAuth && !user) {
    return (
      <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans flex items-center justify-center p-6 overflow-hidden animate-page-entry">
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-bronze/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-bronze/3 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-gradient-to-b from-[#121214] to-[#0f0e0c] p-8 backdrop-blur-sm text-center shadow-2xl space-y-8 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border border-bronze/35 bg-bronze/5 flex items-center justify-center text-3xl shadow-lg">
              🎴
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl text-foreground font-light">
                {isIt ? 'Area Riservata Collezione TCG' : 'TCG Collection Restricted'}
              </h2>
              <p className="text-[10px] text-bronze uppercase tracking-[0.2em] font-bold">
                Kudjo Original Set
              </p>
            </div>
          </div>

          <p className="text-neutral-400 text-xs leading-relaxed">
            {isIt
              ? 'Accedi con il tuo account Google per visualizzare la tua collezione digitale di carte trovate, sbloccare i codici sconto dei traguardi e gestire le tue buste da aprire.'
              : 'Sign in with your Google account to view your digital TCG collection, unlock milestone reward discount codes, and manage your pending packs.'
            }
          </p>

          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-neutral-100 text-[#0a0a0b] py-3.5 px-6 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-xl font-sans"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{isIt ? 'Accedi con Google' : 'Sign in with Google'}</span>
            </button>
          </div>
          
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
            Secure Auth powered by Supabase
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans animate-page-entry">
      {/* Decorative glows */}
      <div className="absolute top-20 left-1/4 h-[400px] w-[400px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 h-[500px] w-[500px] rounded-full bg-bronze/3 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16 space-y-16">

        {/* ── PROFILE & AUTH CARD ── */}
        <section className="rounded-2xl border border-white/5 bg-gradient-to-r from-[#121214]/80 to-[#1b1b1f]/40 p-6 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          {/* Subtle light glow */}
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-bronze/5 blur-[50px] pointer-events-none" />

          {loadingAuth ? (
            <div className="text-neutral-500 text-xs animate-pulse py-4 w-full text-center">
              {isIt ? 'Verifica sessione...' : 'Checking session...'}
            </div>
          ) : user ? (
            <div className="flex items-center justify-between w-full flex-col md:flex-row gap-4">
              <div className="flex items-center gap-4">
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name || 'Avatar'}
                    className="w-12 h-12 rounded-full border border-bronze/40 shadow-inner object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-lg text-neutral-400 font-bold">
                    {user.email?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left space-y-0.5">
                  <div className="text-sm font-bold text-foreground">
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isIt ? 'COLLEZIONE CLOUD ATTIVA' : 'CLOUD STORAGE ONLINE'}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t border-white/5 pt-4 md:border-t-0 md:pt-0">
                {/* Tickets Counter Badge */}
                <Link
                  href="/concorso"
                  className="flex items-center gap-3 border border-bronze/35 bg-bronze/5 hover:bg-bronze/10 px-4 py-2 rounded-xl text-bronze transition-all shadow-md group select-none text-left"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300">🎟️</span>
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                      {isIt ? 'I tuoi ticket' : 'Your tickets'}
                    </div>
                    <div className="text-sm font-bold font-mono leading-none">
                      {userTickets}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:text-foreground transition-all cursor-pointer font-sans"
                >
                  {isIt ? 'Disconnetti' : 'Sign Out'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full flex-col md:flex-row gap-4">
              <div className="text-left max-w-md space-y-1">
                <div className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
                  {isIt ? 'SALVA IL TUO PROGRESSO' : 'SAVE YOUR PROGRESS'}
                </div>
                <p className="text-neutral-400 text-xs">
                  {isIt
                    ? 'Accedi con Google per sincronizzare la tua collezione digitale e le buste sul database cloud Supabase.'
                    : 'Sign in with Google to synchronize your TCG collection and packs on Supabase secure cloud.'
                  }
                </p>
              </div>
              <button
                onClick={handleGoogleLogin}
                className="bg-white hover:bg-neutral-100 text-[#0f0e0c] py-3 px-6 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2.5 cursor-pointer shadow-lg font-sans"
              >
                {/* Google Logo Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{isIt ? 'Accedi con Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </section>

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
                  className={`relative rounded-xl border p-5 transition-all ${
                    unlocked
                      ? 'border-bronze/40 bg-bronze/5 shadow-[0_0_15px_rgba(223,174,11,0.08)]'
                      : 'border-white/5 bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`text-3xl ${unlocked ? '' : 'opacity-30'}`}>{m.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm sm:text-base font-bold tracking-wider uppercase ${unlocked ? 'text-bronze' : 'text-neutral-500'}`}>
                          {isIt ? m.labelIt : m.labelEn}
                        </span>
                        {unlocked ? (
                          <span className="text-[9px] sm:text-[10px] font-bold tracking-widest bg-bronze/20 text-bronze px-2 py-0.5 rounded border border-bronze/30">
                            {t('milestoneUnlocked')}
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-neutral-500 font-mono">
                            {remaining > 0 ? t('milestoneLocked').replace('{n}', String(remaining)) : ''}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${unlocked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        🎁 {isIt ? m.rewardIt : m.rewardEn}
                      </p>
                      {/* Mini progress bar */}
                      {!unlocked && (
                        <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
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

        {/* ── COLLECTION SETS & SCONTI ── */}
        {collectionSets.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="font-display text-xl text-foreground font-light mb-1">
                {isIt ? 'Set da Completare & Sconti' : 'Collection Sets & Discounts'}
              </h2>
              <p className="text-neutral-500 text-xs">
                {isIt
                  ? 'Completa i set di carte richiesti per sbloccare codici sconto permanenti per i tuoi prossimi acquisti.'
                  : 'Complete card sets to unlock permanent discount codes for future purchases.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collectionSets.map((set) => {
                return (
                  <div
                    key={set.id}
                    className={`rounded-xl border p-6 flex flex-col justify-between transition-all relative overflow-hidden ${
                      set.claimed_discount
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : set.is_completed
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : 'border-white/5 bg-white/[0.01]'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Set Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block mb-1">
                            {set.concorso_nome}
                          </span>
                          <h3 className="text-lg font-bold text-white">{set.nome}</h3>
                        </div>
                        <span className="shrink-0 bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold text-xs px-2.5 py-1 rounded-full">
                          -{set.sconto_percentuale}% {isIt ? 'Sconto' : 'Discount'}
                        </span>
                      </div>

                      {set.descrizione && (
                        <p className="text-xs text-neutral-400 leading-relaxed">{set.descrizione}</p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-neutral-400">{isIt ? 'Progresso Set' : 'Set Progress'}</span>
                          <span className={set.is_completed ? 'text-blue-400' : 'text-neutral-300'}>
                            {set.owned_count}/{set.total_count} ({set.progress_percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${set.progress_percentage}%`,
                              background: set.claimed_discount
                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                : 'linear-gradient(90deg, #3b82f6, #2563eb)'
                            }}
                          />
                        </div>
                      </div>

                      {/* Required Cards Badges */}
                      <div className="pt-2">
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">
                          {isIt ? 'Carte nel Set:' : 'Required Cards:'}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {set.card_ids.map((cardId) => {
                            const isOwned = set.owned_card_ids.includes(cardId);
                            const cardInfo = getCardById(cardId);
                            const cardName = cardInfo?.nome || cardId;
                            return (
                              <span
                                key={cardId}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                  isOwned
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
                                    : 'bg-white/[0.02] text-neutral-500 border-white/5'
                                }`}
                              >
                                {isOwned ? '✓ ' : '✕ '}{cardName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Claim / Code Footer */}
                    <div className="border-t border-white/5 pt-4 mt-5">
                      {set.claimed_discount ? (
                        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-emerald-400">
                              {isIt ? 'Codice Sconto Attivo:' : 'Active Discount Code:'}
                            </div>
                            <div className="font-mono text-sm font-bold text-white">{set.claimed_discount.code}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(set.claimed_discount!.code)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            {copiedCode === set.claimed_discount.code ? (isIt ? 'Copiato! ✓' : 'Copied! ✓') : (isIt ? 'Copia' : 'Copy')}
                          </button>
                        </div>
                      ) : set.is_completed ? (
                        <button
                          type="button"
                          onClick={() => handleClaimDiscount(set.id)}
                          disabled={claimingSetId === set.id}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          {claimingSetId === set.id
                            ? (isIt ? 'Riscatto in corso...' : 'Claiming...')
                            : (isIt ? `🎉 Riscatta Sconto ${set.sconto_percentuale}%` : `🎉 Claim ${set.sconto_percentuale}% Discount`)}
                        </button>
                      ) : (
                        <div className="text-center text-xs text-neutral-500 py-1 font-mono">
                          🔒 {isIt ? `Trova ancora ${set.missing_card_ids.length} carte per sbloccare` : `Find ${set.missing_card_ids.length} more cards to unlock`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
      {modalOpen && selectedTier && (
        <PackOpeningModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          packTier={selectedTier}
          packName={selectedPackName}
          availablePacks={selectedPackData?.quantity || 0}
          onPackOpened={() => refreshState()}
        />
      )}
    </div>
  );
}
