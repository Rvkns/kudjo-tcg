'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  getPopulatedItems,
  PopulatedItem,
  mockSets,
} from '@/lib/data/mock-db';
import { maskPublicPrices } from '@/lib/data/price-mask';
import HoloCard from '@/app/components/HoloCard';
import CustomSelect from '@/app/components/CustomSelect';
import { type Gioco } from '@/lib/schema/gioco';

export default function CollectionPage() {
  const t = useTranslations('Collection');
  const tCommon = useTranslations('Common');

  // Filter States
  const [search, setSearch] = useState('');
  const [game, setGame] = useState<'all' | Gioco>('all');
  const [selectedSetId, setSelectedSetId] = useState('all');
  const [condition, setCondition] = useState('all');
  const [graded, setGraded] = useState<'all' | 'graded' | 'raw'>('all');
  const [status, setStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  
  // Mobile UI States
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (game !== 'all') count += 1;
    if (selectedSetId !== 'all') count += 1;
    if (condition !== 'all') count += 1;
    if (graded !== 'all') count += 1;
    if (status !== 'all') count += 1;
    return count;
  }, [search, game, selectedSetId, condition, graded, status]);

  const [dynamicItems, setDynamicItems] = useState<PopulatedItem[] | null>(null);

  React.useEffect(() => {
    fetch('/api/marketplace/items')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setDynamicItems(data.items);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // All populated items loaded dynamically or statically. The static fallback is
  // masked because it ships inside the client JS bundle (see lib/data/price-mask.ts).
  const allItems = useMemo(
    () => dynamicItems ?? maskPublicPrices(getPopulatedItems()),
    [dynamicItems]
  );

  // Filter Sets matching current Game
  const filteredSets = useMemo(() => {
    if (game === 'all') return mockSets;
    return mockSets.filter((s) => s.gioco === game);
  }, [game]);

  // Dropdown options
  const setOptions = useMemo(() => {
    return [
      { value: 'all', label: t('filters.all') },
      ...filteredSets.map((s) => ({
        value: s.id,
        label: `[${s.codice_ufficiale}] ${s.nome}`,
      })),
    ];
  }, [filteredSets, t]);

  const gradedOptions = useMemo(() => [
    { value: 'all', label: t('filters.all') },
    { value: 'graded', label: t('filters.gradedOnly') },
    { value: 'raw', label: t('filters.rawOnly') },
  ], [t]);

  const conditionOptions = useMemo(() => [
    { value: 'all', label: t('filters.all') },
    { value: 'NM', label: 'NM (Near Mint)' },
    { value: 'LP', label: 'LP (Light Played)' },
    { value: 'MP', label: 'MP (Moderate Played)' },
    { value: 'HP', label: 'HP (Heavy Played)' },
    { value: 'DMG', label: 'DMG (Damaged)' },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('filters.all') },
    { value: 'disponibile', label: t('filters.available') },
    { value: 'riservata', label: t('filters.reserved') },
    { value: 'venduta', label: t('filters.sold') },
  ], [t]);

  const sortOptions = useMemo(() => [
    { value: 'recent', label: t('sorting.recent') },
    { value: 'price_asc', label: t('sorting.price_asc') },
    { value: 'price_desc', label: t('sorting.price_desc') },
  ], [t]);

  // Apply filters on client side for instant UI feedback
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    // 1. Search Filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.card.nome.toLowerCase().includes(term) ||
          i.set.nome.toLowerCase().includes(term) ||
          i.card.numero_raccolta.toLowerCase().includes(term) ||
          i.set.codice_ufficiale.toLowerCase().includes(term)
      );
    }

    // 2. Game Filter
    if (game !== 'all') {
      result = result.filter((i) => i.set.gioco === game);
    }

    // 3. Set Filter
    if (selectedSetId !== 'all') {
      result = result.filter((i) => i.set.id === selectedSetId);
    }

    // 4. Condition Filter
    if (condition !== 'all') {
      result = result.filter((i) => i.item.condizione_raw === condition);
    }

    // 5. Graded Filter
    if (graded !== 'all') {
      const isGraded = graded === 'graded';
      result = result.filter((i) => i.item.gradata === isGraded);
    }

    // 6. Status Filter
    if (status !== 'all') {
      result = result.filter((i) => i.item.stato === status);
    }

    // 7. Sorting
    if (sortBy === 'recent') {
      result.sort(
        (a, b) =>
          new Date(b.item.data_inserimento).getTime() -
          new Date(a.item.data_inserimento).getTime()
      );
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.item.prezzo - b.item.prezzo);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.item.prezzo - a.item.prezzo);
    }

    return result;
  }, [allItems, search, game, selectedSetId, condition, graded, status, sortBy]);

  // Reset set selection if it doesn't match selected game
  const handleGameChange = (newGame: 'all' | Gioco) => {
    setGame(newGame);
    setSelectedSetId('all'); // Reset set
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans">
      <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-20">
        {/* Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
            Kudjo Archive
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between gap-4 w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-300">
              {t('filters.title')}
            </span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bronze text-[10px] font-bold text-[#131211]">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 rounded border border-bronze bg-bronze/10 px-4 py-2 text-xs font-bold tracking-wider uppercase text-bronze hover:bg-bronze hover:text-[#131211] transition-all cursor-pointer"
          >
            {/* Filter icon */}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {showMobileFilters ? (tCommon('languages.it') === 'Italiano' ? 'Nascondi Filtri' : 'Hide Filters') : (tCommon('languages.it') === 'Italiano' ? 'Mostra Filtri' : 'Show Filters')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* LEFT: Filters Drawer/Sidebar */}
          <aside className={`lg:col-span-1 flex-col gap-6 border-b lg:border-b-0 lg:border-r border-white/5 pb-10 lg:pb-0 lg:pr-8 transition-all duration-300 ${
            showMobileFilters ? 'flex animate-fade-in' : 'hidden lg:flex'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-widest uppercase text-foreground">
                {t('filters.title')}
              </h2>
              {/* Reset button if any filter active */}
              {(search || game !== 'all' || selectedSetId !== 'all' || condition !== 'all' || graded !== 'all' || status !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setGame('all');
                    setSelectedSetId('all');
                    setCondition('all');
                    setGraded('all');
                    setStatus('all');
                  }}
                  className="text-[10px] text-bronze hover:underline uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Game Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('filters.game')}
              </label>
              <div className="grid grid-cols-3 gap-1 rounded bg-white/5 p-1 border border-white/5 text-[11px] font-bold text-center">
                <button
                  onClick={() => handleGameChange('all')}
                  className={`rounded py-1.5 transition-colors cursor-pointer ${game === 'all' ? 'bg-bronze text-[#0b0b0c]' : 'text-neutral-400 hover:text-foreground'}`}
                >
                  {t('filters.all')}
                </button>
                <button
                  onClick={() => handleGameChange('pokemon')}
                  className={`rounded py-1.5 transition-colors cursor-pointer ${game === 'pokemon' ? 'bg-bronze text-[#0b0b0c]' : 'text-neutral-400 hover:text-foreground'}`}
                >
                  Pokémon
                </button>
                <button
                  onClick={() => handleGameChange('one_piece')}
                  className={`rounded py-1.5 transition-colors cursor-pointer ${game === 'one_piece' ? 'bg-bronze text-[#0b0b0c]' : 'text-neutral-400 hover:text-foreground'}`}
                >
                  One Piece
                </button>
              </div>
            </div>

            {/* Set Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('filters.set')}
              </label>
              <CustomSelect
                value={selectedSetId}
                onChange={setSelectedSetId}
                options={setOptions}
              />
            </div>

            {/* Graded Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('filters.graded')}
              </label>
              <CustomSelect
                value={graded}
                onChange={(val) => setGraded(val as 'all' | 'graded' | 'raw')}
                options={gradedOptions}
              />
            </div>

            {/* Condition Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('filters.condition')}
              </label>
              <CustomSelect
                value={condition}
                onChange={setCondition}
                options={conditionOptions}
              />
            </div>

            {/* Status Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('filters.status')}
              </label>
              <CustomSelect
                value={status}
                onChange={setStatus}
                options={statusOptions}
              />
            </div>
          </aside>

          {/* RIGHT: Search, Grid, and Sorting */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl p-4">
              {/* Search input */}
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-foreground placeholder-neutral-600 focus:border-bronze focus:outline-none"
                />
                {/* Search Icon */}
                <svg
                  className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 whitespace-nowrap">
                  {t('sorting.title')}
                </span>
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val as 'recent' | 'price_asc' | 'price_desc')}
                  options={sortOptions}
                  className="w-52"
                />
              </div>
            </div>

            {/* Cards Grid */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-2xl py-24 text-center">
                <svg
                  className="h-10 w-10 text-neutral-700 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-sm text-neutral-500">{t('empty')}</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/collezione/${item.id}`}
                      className="block"
                    >
                      <HoloCard populatedItem={item} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
