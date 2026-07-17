'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { type KudjoCard as KudjoCardType } from '@/lib/schema/kudjo-card';
import { drawPackCards, addCardsToCollection, consumeOnePack, consumeMultiplePacks } from '@/lib/data/kudjo-cards-db';
import KudjoCard from './KudjoCard';

interface PackOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  packTier: string;
  packName: string;
  availablePacks: number;
  onPackOpened: () => void; // callback to refresh parent state
}

type Phase = 'idle' | 'opening' | 'done';
type OpeningStep = 'idle' | 'zoom' | 'rip' | 'reveal' | 'done';

const TIER_COVER: Record<string, string> = {
  bronze:   '/images/concorso/bronze_pack_tcg.png',
  silver:   '/images/concorso/silver_pack_tcg.png',
  gold:     '/images/concorso/gold_pack_tcg.png',
  platinum: '/images/concorso/platinum_pack_tcg.png',
};

const RARITY_LABELS: Record<string, { it: string; color: string }> = {
  comune:     { it: 'COMUNE',     color: '#888888' },
  non_comune: { it: 'NON COMUNE', color: '#7ab8e8' },
  raro:       { it: 'RARO',       color: '#dfae0b' },
};

export default function PackOpeningModal({
  isOpen,
  onClose,
  packTier,
  packName,
  availablePacks,
  onPackOpened,
}: PackOpeningModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [openingStep, setOpeningStep] = useState<OpeningStep>('idle');
  const [drawnCards, setDrawnCards] = useState<KudjoCardType[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const resetModal = useCallback(() => {
    setPhase('idle');
    setOpeningStep('idle');
    setDrawnCards([]);
    setRevealedCount(0);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleStartOpening = useCallback(() => {
    if (availablePacks <= 0 || phase !== 'idle') return;

    // Consume one pack from localStorage
    const ok = consumeOnePack(packTier);
    if (!ok) return;

    // Draw cards & save immediately to avoid data loss
    const cards = drawPackCards();
    setDrawnCards(cards);
    addCardsToCollection(cards, packTier);
    onPackOpened(); // Refresh parent collections

    // Transition to opening & trigger sequential steps
    setPhase('opening');
    setOpeningStep('zoom');

    // 1. Zoom in and show laser seam line cut (0ms - 800ms)
    // 2. Cut & Rip top off (800ms - 1700ms)
    setTimeout(() => {
      setOpeningStep('rip');
    }, 800);

    // 3. Shoot out fanned cards from inside pack (1700ms)
    setTimeout(() => {
      setOpeningStep('reveal');
    }, 1700);

    // 4. Flip cards one by one (2400ms - 4500ms)
    cards.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCount(i + 1);
      }, 2400 + i * 450);
    });

    // 5. Complete and show grid layout (5200ms)
    setTimeout(() => {
      setPhase('done');
      setOpeningStep('done');
    }, 5200);

  }, [availablePacks, phase, packTier, onPackOpened]);

  const handleOpenAll = useCallback(async () => {
    if (availablePacks <= 0 || phase !== 'idle') return;

    // Consume all packs
    const ok = await consumeMultiplePacks(packTier, availablePacks);
    if (!ok) return;

    // Draw all cards
    const allCards: KudjoCardType[] = [];
    for (let i = 0; i < availablePacks; i++) {
      allCards.push(...drawPackCards());
    }

    // Save all to database collection
    await addCardsToCollection(allCards, packTier);
    onPackOpened(); // Refresh parent collection

    setDrawnCards(allCards);
    setPhase('opening');
    setOpeningStep('reveal'); // Trigger fanned layout immediately
    setRevealedCount(allCards.length); // All cards flipped

    // Transition to done summary after a quick transition animation
    setTimeout(() => {
      setPhase('done');
      setOpeningStep('done');
    }, 1100);
  }, [availablePacks, phase, packTier, onPackOpened]);

  // Group drawn cards by ID for multiple packs summary layout
  const groupedDrawnCards = useMemo(() => {
    const map: Record<string, { card: KudjoCardType; count: number }> = {};
    for (const card of drawnCards) {
      if (!map[card.id]) {
        map[card.id] = { card, count: 0 };
      }
      map[card.id].count += 1;
    }
    return Object.values(map).sort((a, b) => a.card.numero - b.card.numero);
  }, [drawnCards]);

  const handleOpenAnother = () => {
    resetModal();
  };

  if (!isOpen) return null;

  const coverSrc = TIER_COVER[packTier] ?? TIER_COVER.bronze;

  // Custom fan style for fanning out cards dynamically from pack center
  const getFanStyle = (index: number, isFanned: boolean, isRevealed: boolean) => {
    if (!isFanned) {
      return {
        position: 'absolute' as const,
        left: '50%',
        top: '50%',
        transform: 'translate3d(-50%, -40%, 0) scale(0.05) rotateY(180deg)',
        opacity: 0,
        zIndex: 10,
        transformStyle: 'preserve-3d' as const,
        transition: 'transform 0.4s ease-in, opacity 0.3s ease',
      };
    }

    const offsets = [
      { x: -170, y: 10,  rot: -18, scale: 0.9 },
      { x: -85,  y: -20, rot: -9,  scale: 0.95 },
      { x: 0,    y: -30, rot: 0,   scale: 1.0 },
      { x: 85,   y: -20, rot: 9,   scale: 0.95 },
      { x: 170,  y: 10,  rot: 18,  scale: 0.9 }
    ];
    
    const offset = offsets[index] || { x: 0, y: 0, rot: 0, scale: 1 };
    
    return {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      // Combine 3D rotation with position transforms
      transform: `translate3d(-50%, -50%, 0) translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${offset.rot}deg) scale(${offset.scale}) rotateY(${isRevealed ? 0 : 180}deg)`,
      transformStyle: 'preserve-3d' as const,
      transition: `transform 1.1s cubic-bezier(0.175, 0.885, 0.32, 1.25) ${index * 0.12}s, opacity 0.6s ease ${index * 0.12}s`,
      zIndex: 15 + index,
      opacity: 1,
    };
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(10px)' }}
      onClick={phase === 'done' ? handleClose : undefined}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-3xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: '#0a0a0b' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 text-neutral-500 hover:text-foreground transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── IDLE PHASE ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 py-14 px-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-bronze/35 bg-bronze/5 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-bronze">
              🎴 APERTURA BUSTA
            </div>
            
            <div className="text-center space-y-1">
              <h2 className="font-display text-2xl md:text-3xl text-foreground font-light">
                {packName}
              </h2>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">
                Disponibili: <span className="text-foreground font-bold font-mono">{availablePacks}</span>
              </p>
            </div>

            {/* Clickable 3D Pack Cover with Floating Effect */}
            <div 
              onClick={handleStartOpening}
              className="relative w-48 h-64 cursor-pointer select-none group floating-pack mt-4 transition-transform duration-300 hover:scale-[1.03]"
            >
              {/* Interactive glow border and label */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-30 rounded-xl border border-bronze/20">
                <div className="bg-bronze text-[#0a0a0b] text-[10px] font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 tracking-widest uppercase">
                  Tocca per aprire
                </div>
              </div>

              {/* Complete pack cover */}
              <img 
                src={coverSrc} 
                alt={packName} 
                className="w-full h-full object-contain p-2 filter drop-shadow-[0_10px_15px_rgba(223,174,11,0.15)] group-hover:drop-shadow-[0_15px_25px_rgba(223,174,11,0.25)] transition-all duration-300" 
              />
            </div>

            <div className="flex flex-col items-center gap-3 w-full max-w-xs mt-2">
              <button
                onClick={handleStartOpening}
                className="w-full bg-[#e11b22] hover:bg-red-700 text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer shadow-lg font-sans"
              >
                Apri 1 Busta Singola
              </button>

              {availablePacks > 1 && (
                <button
                  onClick={handleOpenAll}
                  className="w-full bg-transparent hover:bg-white/5 border border-bronze/40 text-bronze py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer font-sans"
                >
                  ⚡ Apri Tutte le Buste ({availablePacks})
                </button>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">
                Contiene 5 carte casuali · Kudjo Set I
              </p>
            </div>
          </div>
        )}

        {/* ── OPENING / TEAR ANIMATION PHASE ── */}
        {phase === 'opening' && (
          <div className="relative w-full h-[540px] flex items-center justify-center p-8 overflow-hidden">
            
            {/* Holographic sparkle particles backdrop during reveal */}
            {openingStep === 'reveal' && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,174,11,0.06)_0%,transparent_70%)] animate-pulse pointer-events-none" />
            )}

            {/* The Pack Wrapper (to align the cut line and scissor perfectly) */}
            {(openingStep === 'zoom' || openingStep === 'rip') && (
              <div className="relative w-52 h-72 scale-[1.12] transition-transform duration-400 ease-out z-20">
                {/* Laser Cut Line & Scissor */}
                {openingStep === 'zoom' && (
                  <>
                    <div className="laser-line" />
                    <div className="scissor-cut">✂️</div>
                  </>
                )}

                {/* 1. Pack Top Part (rips off) */}
                <div
                  className={`absolute inset-0 z-30 pointer-events-none ${
                    openingStep === 'rip' ? 'animate-rip-top' : ''
                  }`}
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% 16%, 85% 14%, 70% 17%, 50% 13%, 35% 16%, 20% 13%, 0 15%)',
                    WebkitClipPath: 'polygon(0 0, 100% 0, 100% 16%, 85% 14%, 70% 17%, 50% 13%, 35% 16%, 20% 13%, 0 15%)',
                  }}
                >
                  <img src={coverSrc} alt={packName} className="w-full h-full object-contain p-2" />
                </div>

                {/* 2. Pack Bottom Pouch Part */}
                <div
                  className={`absolute inset-0 z-20 pointer-events-none ${
                    openingStep === 'rip' ? 'animate-rip-bottom' : ''
                  }`}
                  style={{
                    clipPath: 'polygon(0 15%, 20% 13%, 35% 16%, 50% 13%, 70% 17%, 85% 14%, 100% 16%, 100% 100%, 0 100%)',
                    WebkitClipPath: 'polygon(0 15%, 20% 13%, 35% 16%, 50% 13%, 70% 17%, 85% 14%, 100% 16%, 100% 100%, 0 100%)',
                  }}
                >
                  <img src={coverSrc} alt={packName} className="w-full h-full object-contain p-2" />
                </div>
              </div>
            )}

            {/* 2b. Bottom pouch part fadeout during card reveal */}
            {openingStep === 'reveal' && (
              <div
                className="absolute w-52 h-72 z-20 pointer-events-none opacity-0 scale-90 translate-y-12 transition-all duration-1000"
                style={{
                  clipPath: 'polygon(0 15%, 20% 13%, 35% 16%, 50% 13%, 70% 17%, 85% 14%, 100% 16%, 100% 100%, 0 100%)',
                  WebkitClipPath: 'polygon(0 15%, 20% 13%, 35% 16%, 50% 13%, 70% 17%, 85% 14%, 100% 16%, 100% 100%, 0 100%)',
                }}
              >
                <img src={coverSrc} alt={packName} className="w-full h-full object-contain p-2" />
              </div>
            )}

            {/* 3. Fanning Cards (emerge from inside pack bottom) */}
            {drawnCards.length > 0 && (
              <div className="relative w-full h-full">
                {drawnCards.map((card, i) => {
                  const isFanned = openingStep === 'reveal';
                  const isRevealed = i < revealedCount;
                  const fanStyle = getFanStyle(i, isFanned, isRevealed);

                  return (
                    <div key={`${card.id}-${i}`} style={fanStyle}>
                      {/* 3D card flipper with backface culling */}
                      <div className="relative w-[160px] h-[224px]" style={{ transformStyle: 'preserve-3d' }}>
                        
                        {/* Card Front Side */}
                        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          <KudjoCard card={card} size="normal" faceDown={false} disableZoom />
                          {/* Holographic flash upon flip reveal */}
                          {isRevealed && (
                            <div
                              className="absolute inset-0 rounded-lg pointer-events-none z-40"
                              style={{
                                animation: 'rarityFlash 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                                background: card.rarita === 'raro' 
                                  ? 'radial-gradient(circle at 50% 50%, rgba(223,174,11,0.5) 0%, transparent 80%)'
                                  : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 80%)',
                              }}
                            />
                          )}
                        </div>

                        {/* Card Back Side */}
                        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <KudjoCard card={card} size="normal" faceDown={true} />
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DONE PHASE ── */}
        {phase === 'done' && (
          <div className="flex flex-col items-center gap-6 p-8 animate-page-entry">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-bronze/35 bg-bronze/5 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-bronze">
              ✨ HAI TROVATO
            </div>

            {/* Static cards grid after anim sequence finishes */}
            <div className="flex items-center justify-center gap-4 flex-wrap min-h-[240px] max-h-[380px] overflow-y-auto w-full py-4 pr-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              {drawnCards.length <= 5 ? (
                drawnCards.map((card, i) => (
                  <div
                    key={`done-${card.id}-${i}`}
                    className="animate-card-bounce"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <KudjoCard card={card} size="normal" faceDown={false} />
                  </div>
                ))
              ) : (
                groupedDrawnCards.map((item, i) => (
                  <div
                    key={`done-grouped-${item.card.id}-${i}`}
                    className="animate-card-bounce"
                    style={{ animationDelay: `${Math.min(1.0, i * 0.04)}s` }}
                  >
                    <KudjoCard card={item.card} size="normal" faceDown={false} duplicates={item.count} />
                  </div>
                ))
              )}
            </div>

            {/* Rarity descriptions / Box opening summary */}
            <div className="flex items-center gap-2 flex-wrap justify-center text-xs tracking-wider">
              {drawnCards.length <= 5 ? (
                drawnCards.map((card, i) => {
                  const rCfg = RARITY_LABELS[card.rarita];
                  return (
                    <div
                      key={`badge-${i}`}
                      className="text-[8px] font-bold tracking-wider uppercase px-2.5 py-1 rounded border"
                      style={{ color: rCfg.color, borderColor: rCfg.color + '35', background: rCfg.color + '0a' }}
                    >
                      {card.nome} · {rCfg.it}
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="text-neutral-400 font-bold uppercase tracking-widest text-[8px] px-2.5 py-1 bg-white/5 border border-white/10 rounded">
                    📦 BUSTE APERTE: {drawnCards.length / 5} ({drawnCards.length} CARTE)
                  </div>
                  <div className="text-[#dfae0b] font-bold uppercase tracking-widest text-[8px] px-2.5 py-1 bg-[#dfae0b]/10 border border-[#dfae0b]/20 rounded">
                    ★ RARE: {drawnCards.filter(c => c.rarita === 'raro').length}
                  </div>
                  <div className="text-[#7ab8e8] font-bold uppercase tracking-widest text-[8px] px-2.5 py-1 bg-[#7ab8e8]/10 border border-[#7ab8e8]/20 rounded">
                    ★ NON COMUNI: {drawnCards.filter(c => c.rarita === 'non_comune').length}
                  </div>
                  <div className="text-neutral-400 font-bold uppercase tracking-widest text-[8px] px-2.5 py-1 bg-neutral-800/20 border border-neutral-700/25 rounded">
                    ★ COMUNI: {drawnCards.filter(c => c.rarita === 'comune').length}
                  </div>
                </>
              )}
            </div>

            {/* Bottom action panel */}
            <div className="flex flex-col items-center gap-3 w-full max-w-xs mt-4">
              <div className="w-full bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 py-3 rounded-lg text-xs font-bold tracking-widest uppercase text-center shadow-sm">
                ✓ Aggiunte alla tua collezione!
              </div>

              <div className="flex gap-3 w-full">
                {availablePacks > 1 && (
                  <button
                    onClick={handleOpenAnother}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer font-sans"
                  >
                    Apri un&apos;altra →
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="flex-1 bg-[#e11b22] hover:bg-red-700 text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer shadow-lg font-sans"
                >
                  {availablePacks > 1 ? 'Chiudi' : 'Vai al Profilo'}
                </button>
              </div>

              <span className="text-[10px] text-neutral-500 tracking-wider font-sans uppercase">
                Clicca all&apos;esterno per chiudere il riepilogo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Animations and Keyframes */}
      <style>{`
        /* Floating booster pack cover style */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .floating-pack {
          animation: float 2.8s ease-in-out infinite;
        }

        /* Seam cut line sweep effect */
        @keyframes laserSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .laser-line {
          position: absolute;
          top: 15.5%;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ffe066 30%, #dfae0b 50%, #ffe066 70%, transparent);
          box-shadow: 0 0 10px #dfae0b, 0 0 20px #ffe066;
          z-index: 40;
          animation: laserSweep 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* Scissor Cut animations */
        @keyframes scissorMove {
          0% { left: -10%; transform: translateY(-50%) rotate(0deg) scale(1); }
          15% { transform: translateY(-50%) rotate(-12deg) scale(1.1); }
          30% { transform: translateY(-50%) rotate(12deg) scale(0.95); }
          45% { transform: translateY(-50%) rotate(-12deg) scale(1.1); }
          60% { transform: translateY(-50%) rotate(12deg) scale(0.95); }
          75% { transform: translateY(-50%) rotate(-12deg) scale(1.1); }
          90% { transform: translateY(-50%) rotate(12deg) scale(0.95); }
          100% { left: 110%; transform: translateY(-50%) rotate(0deg) scale(1); }
        }
        .scissor-cut {
          position: absolute;
          top: 15.5%;
          width: 32px;
          height: 32px;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          pointer-events: none;
          animation: scissorMove 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* Tear Rip animations */
        @keyframes ripTop {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1.12); opacity: 1; }
          25% { transform: translate3d(-8px, 4px, 0) rotate(-1.5deg) scale(1.12); opacity: 1; }
          100% { transform: translate3d(120px, -240px, 0) rotate(42deg) scale(1.0); opacity: 0; }
        }
        .animate-rip-top {
          animation: ripTop 1.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes ripBottom {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.12); }
          15%, 45%, 75% { transform: translate3d(-3px, 2px, 0) rotate(-0.5deg) scale(1.12); }
          30%, 60%, 90% { transform: translate3d(3px, -2px, 0) rotate(0.5deg) scale(1.12); }
        }
        .animate-rip-bottom {
          animation: ripBottom 1.1s ease-in-out;
        }

        /* Holographic flip shine flash */
        @keyframes rarityFlash {
          0% { opacity: 0; transform: scale(0.95); }
          15% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.05); }
        }

        /* Entrance bounce for cards in done layout */
        @keyframes cardEntrance {
          0% { transform: translateY(20px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-card-bounce {
          animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        /* Card zoom lightbox entrance */
        @keyframes zoomIn {
          0% { opacity: 0; transform: scale(0.82); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-zoom-in {
          animation: zoomIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
