'use client';

import React, { useState, useCallback } from 'react';
import { type KudjoCard } from '@/lib/schema/kudjo-card';
import { drawPackCards, addCardsToCollection, consumeOnePack } from '@/lib/data/kudjo-cards-db';
import KudjoCard from './KudjoCard';

interface PackOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  packTier: string;
  packName: string;
  availablePacks: number;
  onPackOpened: () => void; // callback to refresh parent state
}

type Phase = 'idle' | 'shaking' | 'revealing' | 'done';

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
  const [drawnCards, setDrawnCards] = useState<KudjoCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [saved, setSaved] = useState(false);

  const resetModal = useCallback(() => {
    setPhase('idle');
    setDrawnCards([]);
    setRevealedCount(0);
    setSaved(false);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleOpenPack = useCallback(() => {
    if (availablePacks <= 0 || phase !== 'idle') return;

    // Consume one pack from localStorage
    const ok = consumeOnePack(packTier);
    if (!ok) return;

    setPhase('shaking');

    setTimeout(() => {
      const cards = drawPackCards();
      setDrawnCards(cards);

      // ── Save immediately – cards are yours as soon as the pack is opened ──
      addCardsToCollection(cards, packTier);
      setSaved(true);
      onPackOpened(); // notify parent to refresh pack count + collection

      setPhase('revealing');
      setRevealedCount(0);

      // Reveal cards one by one
      cards.forEach((_, i) => {
        setTimeout(() => {
          setRevealedCount(i + 1);
        }, 600 + i * 500);
      });

      // After all revealed
      setTimeout(() => {
        setPhase('done');
      }, 600 + cards.length * 500 + 400);

    }, 1200);
  }, [availablePacks, phase, packTier, onPackOpened]);

  const handleOpenAnother = () => {
    resetModal();
  };

  if (!isOpen) return null;

  const coverSrc = TIER_COVER[packTier] ?? TIER_COVER.bronze;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={phase === 'done' ? handleClose : undefined}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: '#0f0e0c' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 text-neutral-500 hover:text-foreground transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── IDLE PHASE ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 p-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-bronze/35 bg-bronze/5 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-bronze">
              🎴 APERTURA BUSTA
            </div>
            <h2 className="font-display text-2xl text-foreground font-light text-center">
              Sei pronto ad aprire<br />
              <span className="text-bronze font-normal">{packName}</span>?
            </h2>

            {/* Pack cover image / fallback */}
            <div className="relative w-36 h-48 rounded-xl overflow-hidden border border-white/10 bg-[#121214] flex items-center justify-center shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc} alt={packName} className="w-full h-full object-contain p-2" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-center py-1 tracking-widest uppercase text-bronze">
                {packName}
              </div>
            </div>

            <p className="text-neutral-400 text-sm text-center max-w-xs">
              Ogni busta contiene <strong className="text-foreground">5 carte</strong> casuali del{' '}
              <strong className="text-bronze">Kudjo Original Set I</strong>.<br />
              Potrai trovare carte Comuni, Non Comuni e persino Rare!
            </p>

            <div className="text-xs text-neutral-500 text-center">
              Buste disponibili: <span className="text-foreground font-bold">{availablePacks}</span>
            </div>

            <button
              onClick={handleOpenPack}
              disabled={availablePacks <= 0}
              className="bg-[#e11b22] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 px-10 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(225,27,34,0.2)]"
            >
              <span>Apri la Busta!</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* ── SHAKING PHASE ── */}
        {phase === 'shaking' && (
          <div className="flex flex-col items-center gap-8 p-12">
            <div
              className="relative w-36 h-48 rounded-xl overflow-hidden border border-white/10 bg-[#121214] flex items-center justify-center shadow-2xl"
              style={{ animation: 'packShake 0.3s ease-in-out infinite' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc} alt={packName} className="w-full h-full object-contain p-2" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <p className="text-bronze font-display text-xl animate-pulse">Aprendo la busta...</p>
          </div>
        )}

        {/* ── REVEALING PHASE ── */}
        {(phase === 'revealing' || phase === 'done') && (
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-bronze/35 bg-bronze/5 px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-bronze">
              {phase === 'done' ? '✨ HAI TROVATO' : '🎴 RIVELAZIONE...'}
            </div>

            {/* Cards row */}
            <div className="flex items-center justify-center gap-3 flex-wrap min-h-[240px]">
              {drawnCards.map((card, i) => {
                const isRevealed = i < revealedCount;
                return (
                  <div
                    key={`${card.id}-${i}`}
                    className="relative"
                    style={{
                      transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                      transform: isRevealed ? 'rotateY(0deg) scale(1)' : 'rotateY(90deg) scale(0.8)',
                      opacity: isRevealed ? 1 : 0,
                      perspective: '600px',
                    }}
                  >
                    <KudjoCard card={card} size="normal" faceDown={!isRevealed} />
                    {/* Rarity flash */}
                    {isRevealed && card.rarita === 'raro' && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          animation: 'rarityFlash 0.8s ease-out forwards',
                          background: 'radial-gradient(circle at 50% 50%, rgba(223,174,11,0.6) 0%, transparent 70%)',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rarity summary */}
            {phase === 'done' && (
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {drawnCards.map((card, i) => {
                  const rCfg = RARITY_LABELS[card.rarita];
                  return (
                    <div
                      key={`badge-${i}`}
                      className="text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border"
                      style={{ color: rCfg.color, borderColor: rCfg.color + '50', background: rCfg.color + '10' }}
                    >
                      {card.nome} · {rCfg.it}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            {phase === 'done' && (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                {/* Auto-save confirmation banner */}
                <div className="w-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 py-3 rounded-lg text-xs font-bold tracking-widest uppercase text-center">
                  ✓ Carte aggiunte alla tua collezione!
                </div>

                <div className="flex gap-3 w-full">
                  {availablePacks > 1 && (
                    <button
                      onClick={handleOpenAnother}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer"
                    >
                      Apri un&apos;altra →
                    </button>
                  )}

                  <button
                    onClick={handleClose}
                    className="flex-1 bg-[#e11b22] hover:bg-red-700 text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer shadow-lg"
                  >
                    {availablePacks > 1 ? 'Chiudi' : 'Vai al Profilo'}
                  </button>
                </div>

                <span className="text-[10px] text-neutral-600 tracking-wider">
                  Clicca fuori dal pannello per chiudere
                </span>
              </div>
            )}


          </div>
        )}
      </div>

      {/* Inline keyframes via style tag */}
      <style>{`
        @keyframes packShake {
          0%   { transform: translateX(0) rotate(0deg); }
          25%  { transform: translateX(-6px) rotate(-2deg); }
          50%  { transform: translateX(6px) rotate(2deg); }
          75%  { transform: translateX(-4px) rotate(-1deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes rarityFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes holoShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
