'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { addPendingPacks, getTotalPendingPacks } from '@/lib/data/kudjo-cards-db';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';


interface PackageOption {
  id: string;
  name: string;
  cards: number;
  tickets: number;
  bonus: number;
  price: number;
  image: string;
  labelText: string;
}

// Gallery images (Prize + 4 Packages) defined statically outside component to prevent recreation
const galleryImages = [
  '/images/concorso/tcg_prize.png',
  '/images/concorso/bronze_pack_tcg.png',
  '/images/concorso/silver_pack_tcg.png',
  '/images/concorso/gold_pack_tcg.png',
  '/images/concorso/platinum_pack_tcg.png',
];

export default function ConcorsoPage() {
  const t = useTranslations('Concorso');
  const locale = useLocale();
  const isIt = locale === 'it';

  // Packages list memoized to prevent warnings
  const packages = useMemo<PackageOption[]>(() => [
    {
      id: 'bronze',
      name: 'BRONZE #1',
      cards: 1,
      tickets: 10,
      bonus: 0,
      price: 5.00,
      image: '/images/concorso/bronze_pack_tcg.png',
      labelText: isIt ? '1 BUSTA TCG + 10 TICKET OMAGGIO' : '1 TCG PACK + 10 FREE TICKETS',
    },
    {
      id: 'silver',
      name: 'SILVER #2',
      cards: 6,
      tickets: 50,
      bonus: 5,
      price: 25.00,
      image: '/images/concorso/silver_pack_tcg.png',
      labelText: isIt ? '6 BUSTE TCG + 55 TICKET OMAGGIO' : '6 TCG PACKS + 55 FREE TICKETS',
    },
    {
      id: 'gold',
      name: 'GOLD #3',
      cards: 13,
      tickets: 100,
      bonus: 15,
      price: 50.00,
      image: '/images/concorso/gold_pack_tcg.png',
      labelText: isIt ? '13 BUSTE TCG + 115 TICKET OMAGGIO' : '13 TCG PACKS + 115 FREE TICKETS',
    },
    {
      id: 'platinum',
      name: 'PLATINUM #4',
      cards: 27,
      tickets: 200,
      bonus: 45,
      price: 100.00,
      image: '/images/concorso/platinum_pack_tcg.png',
      labelText: isIt ? '27 BUSTE TCG + 245 TICKET OMAGGIO' : '27 TCG PACKS + 245 FREE TICKETS',
    },
  ], [isIt]);

  // Recommended products list
  const recommendedProducts = [
    {
      id: 'sleeves_pokemon',
      name: isIt ? 'Sleeves Protettive (Pokémon)' : 'Protective Sleeves (Pokémon)',
      price: 9.90,
      image: 'P', // Custom SVG visual styling
      color: 'from-blue-600/20 to-blue-900/40 border-blue-500/20',
      brand: 'Pokémon',
    },
    {
      id: 'sleeves_one_piece',
      name: isIt ? 'Sleeves Protettive (One Piece)' : 'Protective Sleeves (One Piece)',
      price: 9.90,
      image: 'OP',
      color: 'from-red-600/20 to-red-900/40 border-red-500/20',
      brand: 'One Piece',
    },
    {
      id: 'deck_box_premium',
      name: isIt ? 'Portamazzo Premium (Deck Box)' : 'Premium Deck Box',
      price: 14.90,
      image: 'D',
      color: 'from-neutral-700/20 to-neutral-900/40 border-neutral-600/20',
      brand: 'Kudjo',
    },
    {
      id: 'album_collezione',
      name: isIt ? 'Raccoglitore 9-Pocket (Binder)' : '9-Pocket Binder Portfolio',
      price: 24.90,
      image: 'B',
      color: 'from-amber-600/20 to-amber-900/40 border-amber-500/20',
      brand: 'Kudjo',
    },
  ];

  // Active States
  const [selectedPack, setSelectedPack] = useState<PackageOption>(packages[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [mainDisplayImage, setMainDisplayImage] = useState<string>('/images/concorso/bronze_pack_tcg.png');
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState<number>(0);

  // Update main display image when selected pack changes
  useEffect(() => {
    // Pack index in gallery starts at 1 (0 is KTM bike)
    const packIndex = packages.findIndex(p => p.id === selectedPack.id);
    if (packIndex !== -1) {
      setMainDisplayImage(galleryImages[packIndex + 1]);
      setActiveThumbnailIndex(packIndex + 1);
    }
  }, [selectedPack, packages]);

  const handleThumbnailClick = (img: string, idx: number) => {
    setMainDisplayImage(img);
    setActiveThumbnailIndex(idx);
    // If user clicked a pack thumbnail, also select that pack on the right
    if (idx > 0) {
      setSelectedPack(packages[idx - 1]);
    }
  };

  // Countdown Timer logic
  const [countdown, setCountdown] = useState({
    days: '05',
    hours: '06',
    minutes: '01',
    seconds: '23',
  });

  useEffect(() => {
    // Target date: July 19, 2026 (matches original contest duration)
    const targetDate = new Date('2026-07-19T23:59:59').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setCountdown({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null);
  const [totalPendingPacks, setTotalPendingPacks] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      setLoadingAuth(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadPacks = async () => {
      try {
        const total = await getTotalPendingPacks();
        setTotalPendingPacks(total);
      } catch (err) {
        console.error(err);
      }
    };
    loadPacks();
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/' + locale + '/concorso',
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addPendingPacks(selectedPack.id, selectedPack.cards * quantity);
      const total = await getTotalPendingPacks();
      setTotalPendingPacks(total);
      const msg = isIt
        ? `✓ ${selectedPack.cards * quantity} bust${selectedPack.cards * quantity === 1 ? 'a' : 'e'} TCG digitali aggiunte al tuo profilo!`
        : `✓ ${selectedPack.cards * quantity} digital TCG pack${selectedPack.cards * quantity === 1 ? '' : 's'} added to your profile!`;
      setPurchaseNotification(msg);
      setTimeout(() => setPurchaseNotification(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans animate-page-entry">
      {/* Decorative gradient shadows */}
      <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 h-[600px] w-[600px] rounded-full bg-bronze/5 blur-[150px] pointer-events-none" />

      {/* Countdown Sticky Top Ticker */}
      <div className="w-full bg-[#e11b22] py-2.5 px-4 text-white text-center font-sans font-semibold tracking-wider text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-3 shadow-md z-40 relative">
        <div className="flex items-center gap-2">
          <span className="animate-pulse">🔥</span>
          <span className="uppercase text-[10px] md:text-xs font-bold tracking-widest bg-black/25 px-2 py-0.5 rounded">
            {t('countdownPrefix')}
          </span>
          <span className="hidden lg:inline text-white/95 font-medium">
            {isIt ? 'MYSTERY BOX PREMIUM DA €2.500. Partecipa ora!' : 'PREMIUM MYSTERY BOX WORTH €2,500. Enter now!'}
          </span>
        </div>

        {/* Dynamic Timer blocks */}
        <div className="flex items-center gap-1.5 font-mono font-bold text-sm md:text-base bg-black/20 px-3 py-1 rounded backdrop-blur-sm">
          <span className="text-white">{countdown.days}</span>
          <span className="text-white/40 text-[10px] font-sans font-normal uppercase">{t('days').substring(0, 1)}</span>
          <span className="text-white/40 font-sans font-normal mx-0.5">:</span>
          <span className="text-white">{countdown.hours}</span>
          <span className="text-white/40 text-[10px] font-sans font-normal uppercase">{t('hours').substring(0, 1)}</span>
          <span className="text-white/40 font-sans font-normal mx-0.5">:</span>
          <span className="text-white">{countdown.minutes}</span>
          <span className="text-white/40 text-[10px] font-sans font-normal uppercase">{t('minutes').substring(0, 1)}</span>
          <span className="text-white/40 font-sans font-normal mx-0.5">:</span>
          <span className="text-[#ffb7b7]">{countdown.seconds}</span>
          <span className="text-white/40 text-[10px] font-sans font-normal uppercase">{t('seconds').substring(0, 1)}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
        {/* Main Product Showcase grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Showcase and Carousel */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Image Container */}
            <div className="relative aspect-[4/3] md:aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/5 bg-[#121214] shadow-2xl p-4 flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none" />
              
              {/* Prize badge overlay if KTM is selected */}
              {activeThumbnailIndex === 0 && (
                <div className="absolute top-4 left-4 z-20 bg-bronze text-[#0b0b0c] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded shadow-lg border border-bronze/35">
                  {isIt ? 'IL PREMIO' : 'THE PRIZE'}
                </div>
              )}

              {/* Holographic overlay shimmer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none z-20" />

              <div className="relative w-full h-full">
                <Image
                  src={mainDisplayImage}
                  alt="Kudjo Contest Product"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.01]"
                  priority
                />
              </div>
            </div>

            {/* Thumbnail Navigation Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin select-none">
              {galleryImages.map((img, idx) => {
                const isActive = activeThumbnailIndex === idx;
                let label = '';
                if (idx === 0) label = isIt ? 'PREMIO' : 'PRIZE';
                else if (idx === 1) label = 'BRONZE';
                else if (idx === 2) label = 'SILVER';
                else if (idx === 3) label = 'GOLD';
                else if (idx === 4) label = 'PLATINUM';

                return (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailClick(img, idx)}
                    className={`relative flex-shrink-0 h-16 w-20 md:h-20 md:w-28 rounded-lg overflow-hidden border bg-[#121214] p-1 transition-all duration-300 ${
                      isActive 
                        ? 'border-bronze shadow-[0_0_12px_rgba(223,174,11,0.25)] scale-95' 
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx}`}
                        fill
                        sizes="80px"
                        className="object-contain"
                      />
                    </div>
                    {/* Badge on thumbnail */}
                    <div className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.5 tracking-wider uppercase bg-black/80 ${
                      isActive ? 'text-bronze' : 'text-neutral-400'
                    }`}>
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Pack selector and Actions */}
          <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8 bg-white/[0.01] border border-white/5 rounded-xl p-6 md:p-8 backdrop-blur-sm">
            <div>
              {/* Tagline */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-bronze/35 bg-bronze/5 px-3 py-1 text-[8px] font-bold tracking-[0.2em] uppercase text-bronze mb-3">
                📍 {isIt ? 'EDIZIONE LIMITATA' : 'LIMITED EDITION'}
              </div>

              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground font-light leading-snug">
                {t('title')}
              </h1>
            </div>

            {/* Package selector items */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                {t('selectPackage')}
              </span>
              
              <div className="space-y-2.5">
                {packages.map((pack) => {
                  const isSelected = selectedPack.id === pack.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`w-full text-left flex items-center justify-between px-4 py-3.5 rounded-lg border font-sans text-xs tracking-wider transition-all duration-300 ${
                        isSelected
                          ? 'bg-foreground text-background border-foreground font-bold shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                          : 'bg-[#121214]/60 text-foreground border-white/5 hover:border-white/20 hover:bg-[#121214]'
                      }`}
                    >
                      <span className="uppercase">{pack.name}</span>
                      <span className={isSelected ? 'text-neutral-800' : 'text-neutral-400'}>
                        {pack.labelText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing and Ticket multiplier info */}
            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-2">
              <div className="flex flex-col">
                <span className="font-mono text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                  €{(selectedPack.price * quantity).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase mt-1">
                  {isIt ? 'IVA inclusa / consegna digitale' : 'VAT included / digital delivery'}
                </span>
              </div>

              {/* Free ticket details badge */}
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5 bg-[#e11b22] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-md shadow-red-950/20">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>
                    {(selectedPack.tickets + selectedPack.bonus) * quantity} {t('freeTickets')}
                  </span>
                </div>
                {selectedPack.bonus > 0 && (
                  <span className="text-[9px] text-[#e11b22] font-semibold tracking-wider uppercase animate-pulse">
                    {isIt ? `+ ${selectedPack.bonus * quantity} BONUS INCLUSI!` : `+ ${selectedPack.bonus * quantity} BONUS INCLUDED!`}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity selection panel */}
            <div className="flex items-center border border-white/5 bg-[#121214] rounded-lg p-1.5 w-full max-w-[150px]">
              <button 
                onClick={decrementQty}
                className="w-10 h-10 flex items-center justify-center text-lg text-neutral-400 hover:text-foreground hover:bg-white/5 rounded transition-all cursor-pointer font-bold"
              >
                -
              </button>
              <span className="flex-1 text-center text-sm font-mono font-semibold">
                {quantity}
              </span>
              <button 
                onClick={incrementQty}
                className="w-10 h-10 flex items-center justify-center text-lg text-neutral-400 hover:text-foreground hover:bg-white/5 rounded transition-all cursor-pointer font-bold"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-2">
              {loadingAuth ? (
                <div className="text-neutral-500 text-xs animate-pulse text-center py-4">
                  {isIt ? 'Verifica sessione...' : 'Checking session...'}
                </div>
              ) : user ? (
                <>
                  {/* Add to Cart button — also saves digital packs */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-[#e11b22] hover:bg-red-700 text-white py-4 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(225,27,34,0.15)] group"
                  >
                    <span>{t('addToCart')}</span>
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>

                  {/* Purchase notification */}
                  {purchaseNotification && (
                    <div className="text-center text-[10px] text-emerald-400 font-semibold tracking-wide animate-pulse py-1">
                      {purchaseNotification}
                    </div>
                  )}

                  {/* PayPal express checkout */}
                  <button
                    className="w-full bg-[#ffc439] hover:bg-[#e2af30] text-[#003087] py-4 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg font-sans"
                  >
                    <span>{t('payPayPal')}</span>
                  </button>

                  <button className="text-center text-[10px] tracking-wider uppercase text-neutral-500 hover:text-neutral-300 transition-colors mt-2 cursor-pointer">
                    {t('otherPaymentOptions')}
                  </button>

                  {/* Link to profile if packs are pending */}
                  {totalPendingPacks > 0 && (
                    <Link
                      href="/profilo"
                      className="mt-1 flex items-center justify-center gap-2 border border-bronze/40 bg-bronze/5 rounded-lg py-3 text-[10px] font-bold tracking-widest uppercase text-bronze hover:bg-bronze/10 transition-all"
                    >
                      <span>🎴</span>
                      <span>
                        {isIt
                          ? `Apri le tue ${totalPendingPacks} buste nel Profilo →`
                          : `Open your ${totalPendingPacks} pack${totalPendingPacks === 1 ? '' : 's'} in Profile →`
                        }
                      </span>
                    </Link>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-bronze/30 bg-bronze/5 p-5 space-y-4 text-center mt-2">
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    {isIt
                      ? 'Accedi con il tuo account Google per sbloccare l\'acquisto dei pacchetti ed iniziare a collezionare le carte digitali!'
                      : 'Sign in with your Google account to unlock pack purchases and start collecting digital TCG cards!'
                    }
                  </p>
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white hover:bg-neutral-100 text-[#0a0a0b] py-3.5 px-5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-md font-sans"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>{isIt ? 'Accedi con Google' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details & Rules descriptions section */}
        <section className="mt-20 lg:mt-28 border-t border-white/5 pt-16 max-w-4xl">
          <h2 className="font-display text-3xl text-foreground font-light border-b border-white/5 pb-3 mb-8">
            {t('descriptions')}
          </h2>

          <div className="space-y-8 text-neutral-400 text-sm md:text-base leading-loose font-sans">
            <div>
              <h3 className="text-foreground font-display text-xl font-medium mb-3 flex items-center gap-2">
                <span>{isIt ? 'Sbusta i Pacchetti digitali' : 'Unbox Digital TCG Packs'}</span>
                <span>🔥</span>
              </h3>
              <p>
                {isIt ? (
                  <>
                    <strong>Kudjo</strong> presenta le esclusive <strong>Buste Digitali Collezionabili</strong> che contengono carte digitali rare Pokémon e One Piece. Avrai la possibilità di vincere il <strong>Super Lotto TCG Finale (Mystery Box Premium e Carte Gradate)</strong> del valore di €2.500 acquistando i pacchetti promozionali sul nostro sito!
                  </>
                ) : (
                  <>
                    <strong>Kudjo</strong> presents the exclusive <strong>Collectible Digital Booster Packs</strong> containing rare digital Pokémon and One Piece cards. You will have the chance to win the <strong>Ultimate TCG Prize Lot (Premium Mystery Box and Graded Cards)</strong> valued at €2,500 by purchasing promo packages on our site!
                  </>
                )}
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-display text-xl font-medium mb-3">
                {isIt ? 'Come funziona?' : 'How does it work?'}
              </h3>
              <p className="mb-4">
                {isIt ? (
                  <>
                    Acquistando i pacchetti promozionali, avrai la possibilità di aprirli digitalmente nel tuo pannello personale e trovare al loro interno Carte digitali casuali di diverse rarità: <strong className="text-bronze">Comuni, Rare, Epiche o Leggendarie</strong>.
                  </>
                ) : (
                  <>
                    By purchasing promo packages, you will be able to open them digitally in your personal panel and find random digital Cards of different rarities inside: <strong className="text-bronze">Common, Rare, Epic or Legendary</strong>.
                  </>
                )}
              </p>
              <p>
                {isIt ? (
                  <>
                    Collezionandole tutte, potrai completare i Set digitali disponibili direttamente nel tuo account. Raggiungendo determinati traguardi sbloccherai <strong className="text-foreground border-b border-bronze/30 pb-0.5">codici sconto esclusivi</strong> per il nostro store di carte collezionabili fisiche.
                  </>
                ) : (
                  <>
                    By collecting them all, you can complete the digital Sets available directly in your account. By reaching specific milestones, you will unlock <strong className="text-foreground border-b border-bronze/30 pb-0.5">exclusive discount codes</strong> for our physical collectible card store.
                  </>
                )}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl space-y-4">
              <p className="font-semibold text-foreground text-sm uppercase tracking-wider text-bronze">
                {isIt ? 'Ci sono 4 pacchetti disponibili:' : 'There are 4 packs available:'}
              </p>
              <ul className="space-y-3.5 pl-2 text-sm text-neutral-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-bronze mt-1">•</span>
                  {isIt ? (
                    <span>Acquistando i Pacchetti del <strong>Bronze #1</strong> otterrete <strong>10 Tickets Omaggio</strong> e 1 busta digitale casuale.</span>
                  ) : (
                    <span>By purchasing <strong>Bronze #1</strong> Packs, you get <strong>10 Free Tickets</strong> and 1 random digital pack.</span>
                  )}
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-bronze mt-1">•</span>
                  {isIt ? (
                    <span>Acquistando i Pacchetti dello <strong>Silver #2</strong> otterrete 50 Tickets Omaggio + 5 Tickets Bonus per un Totale di <strong>55 Tickets Omaggio</strong> e 3 buste digitali.</span>
                  ) : (
                    <span>By purchasing <strong>Silver #2</strong> Packs, you get 50 Free Tickets + 5 Bonus Tickets for a Total of <strong>55 Free Tickets</strong> and 3 digital packs.</span>
                  )}
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-bronze mt-1">•</span>
                  {isIt ? (
                    <span>Acquistando i Pacchetti dello <strong>Gold #3</strong> otterrete 100 Tickets Omaggio + 15 Tickets Bonus per un Totale di <strong>115 Tickets Omaggio</strong> e 13 buste digitali.</span>
                  ) : (
                    <span>By purchasing <strong>Gold #3</strong> Packs, you get 100 Free Tickets + 15 Bonus Tickets for a Total of <strong>115 Free Tickets</strong> and 13 digital packs.</span>
                  )}
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-bronze mt-1">•</span>
                  {isIt ? (
                    <span>Acquistando i Pacchetti dello <strong>Platinum #4</strong> otterrete 200 Tickets Omaggio + 45 Tickets Bonus per un Totale di <strong>245 Tickets Omaggio</strong> e 27 buste digitali.</span>
                  ) : (
                    <span>By purchasing <strong>Platinum #4</strong> Packs, you get 200 Free Tickets + 45 Bonus Tickets for a Total of <strong>245 Free Tickets</strong> and 27 digital packs.</span>
                  )}
                </li>
              </ul>
            </div>

            <div className="border-t border-white/5 pt-6 text-xs md:text-sm text-neutral-500 space-y-3">
              <p>
                {isIt ? (
                  <>Il prodotto non sarà per sempre disponibile all&apos;acquisto (<strong>Edizione limitata attiva dal 03/07/2026 fino al 19/07/2026</strong>).</>
                ) : (
                  <>The product will not be available for purchase forever (<strong>Limited edition active from 03/07/2026 until 19/07/2026</strong>).</>
                )}
              </p>
              <p>
                {isIt ? (
                  <>Ogni acquisto dei pacchetti digitali dà diritto ai corrispondenti Ticket Omaggio per la partecipazione al sorteggio finale del Super Lotto TCG.</>
                ) : (
                  <>Each purchase of digital packages entitles you to the corresponding Free Tickets to participate in the final draw for the Ultimate TCG Prize Lot.</>
                )}
              </p>
              <p className="pt-2">
                <a href="#regolamento" className="text-bronze hover:text-foreground transition-colors font-medium flex items-center gap-1.5 group max-w-max">
                  <span>👉 {t('rulesText')}</span>
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Recommended Products section */}
        <section className="mt-24 lg:mt-32 border-t border-white/5 pt-16">
          <div className="flex items-end justify-between mb-10 md:mb-12">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
                {isIt ? 'ESTENDI LA TUA PARTECIPAZIONE' : 'EXTEND YOUR ENTRY'}
              </span>
              <h2 className="font-display text-2xl md:text-3xl text-foreground font-light">
                {t('recommendedProducts')}
              </h2>
            </div>
          </div>

          {/* Cards Grid representing recommended items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((prod) => (
              <div
                key={prod.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#121214] p-4 shadow-xl transition-all duration-300 hover:border-bronze/40 hover:shadow-[0_0_20px_rgba(156,122,82,0.1)] cursor-pointer"
              >
                {/* Visual card header representation with logo placeholder */}
                <div className={`relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br ${prod.color} border flex items-center justify-center`}>
                  
                  {/* Glowing letter graphic instead of image */}
                  <span className="font-display text-6xl text-white/10 select-none group-hover:scale-110 transition-transform duration-500">
                    {prod.image}
                  </span>

                  {/* Brand tag overlay */}
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold tracking-widest text-neutral-400 uppercase">
                    {prod.brand}
                  </div>

                  {/* Ticket X2 badge */}
                  <div className="absolute top-2 right-2 bg-[#e11b22] text-white text-[8px] font-bold tracking-widest px-2 py-0.5 rounded shadow">
                    {t('ticketMultiplier')}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 flex flex-col justify-between flex-1 gap-1">
                  <h3 className="font-display text-base text-foreground font-medium group-hover:text-bronze transition-colors">
                    {prod.name}
                  </h3>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                    <span className="text-[10px] text-neutral-500 uppercase">
                      {isIt ? 'PREZZO PRODOTTO' : 'PRODUCT PRICE'}
                    </span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      €{prod.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter Subscription Banner */}
        <section className="mt-28 md:mt-36 rounded-xl border border-white/5 bg-gradient-to-r from-red-950/20 via-neutral-900/40 to-neutral-900/40 p-8 md:p-12 relative overflow-hidden backdrop-blur-sm shadow-2xl">
          {/* Subtle logo vector outline or glowing background shapes */}
          <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-red-600/5 blur-[80px] pointer-events-none" />

          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left space-y-2">
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#e11b22]">
                {isIt ? 'NEWSLETTER CONCORSI' : 'CONTEST NEWSLETTER'}
              </span>
              <h2 className="font-display text-2xl md:text-3xl text-foreground font-light">
                {t('newsletterTitle')}
              </h2>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-2 w-full md:w-auto min-w-[280px] md:min-w-[400px]">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={isIt ? 'Inserisci il tuo indirizzo email' : 'Enter your email address'}
                required
                className="bg-[#121214] border border-white/10 rounded-lg px-4 py-3.5 text-xs text-foreground placeholder-neutral-500 focus:outline-none focus:border-bronze flex-grow transition-all"
              />
              <button
                type="submit"
                className="bg-[#e11b22] hover:bg-red-700 text-white rounded-lg px-6 py-3.5 text-xs font-bold tracking-wider uppercase transition-all flex-shrink-0 cursor-pointer shadow-md"
              >
                {t('newsletterBtn')}
              </button>
            </form>
          </div>

          {newsletterSubscribed && (
            <div className="absolute bottom-2 inset-x-0 text-center text-xs text-emerald-400 font-semibold transition-all animate-bounce">
              ✓ {isIt ? 'Grazie per esserti iscritto alla nostra newsletter!' : 'Thanks for subscribing to our newsletter!'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
