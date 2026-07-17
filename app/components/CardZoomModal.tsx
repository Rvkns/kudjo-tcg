'use client';

import React, { useEffect } from 'react';
import { type KudjoCard } from '@/lib/schema/kudjo-card';

const ELEMENTO_CONFIG: Record<string, { accent: string; icon: string; glow: string }> = {
  fuoco:    { accent: '#e11b22', icon: '🔥', glow: 'rgba(225,27,34,0.4)' },
  acqua:    { accent: '#3b82f6', icon: '💧', glow: 'rgba(59,130,246,0.4)' },
  terra:    { accent: '#22c55e', icon: '🌿', glow: 'rgba(34,197,94,0.4)' },
  ombra:    { accent: '#a855f7', icon: '🌑', glow: 'rgba(168,85,247,0.4)' },
  fulmine:  { accent: '#dfae0b', icon: '⚡', glow: 'rgba(223,174,11,0.4)' },
  ghiaccio: { accent: '#22d3ee', icon: '❄️', glow: 'rgba(34,211,238,0.4)' },
  drago:    { accent: '#f97316', icon: '🐉', glow: 'rgba(249,115,22,0.4)' },
  luce:     { accent: '#fef08a', icon: '✨', glow: 'rgba(254,240,138,0.4)' },
};

const RARITA_CONFIG: Record<string, { label: string; color: string; stars: number }> = {
  comune:     { label: 'Comune',     color: '#888888', stars: 1 },
  non_comune: { label: 'Non Comune', color: '#7ab8e8', stars: 2 },
  raro:       { label: 'Raro',       color: '#dfae0b', stars: 3 },
};

interface CardZoomModalProps {
  card: KudjoCard;
  onClose: () => void;
}

export default function CardZoomModal({ card, onClose }: CardZoomModalProps) {
  const cfg  = ELEMENTO_CONFIG[card.elemento] ?? ELEMENTO_CONFIG.fuoco;
  const rCfg = RARITA_CONFIG[card.rarita]     ?? RARITA_CONFIG.comune;
  const isRaro = card.rarita === 'raro';

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(18px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col sm:flex-row items-center gap-8 sm:gap-12 card-zoom-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="absolute -top-6 -right-6 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer border border-white/10"
          aria-label="Chiudi"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Enlarged card replica ── */}
        <div
          className="relative flex-shrink-0 rounded-xl overflow-hidden select-none"
          style={{
            width: 240,
            height: 336,
            border: `2px solid ${rCfg.color}55`,
            boxShadow: isRaro
              ? `0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}, 0 20px 60px rgba(0,0,0,0.8)`
              : `0 20px 60px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Holo background for rare */}
          {isRaro && (
            <div
              className="absolute inset-0 z-10 pointer-events-none opacity-20"
              style={{
                background: `linear-gradient(135deg, ${cfg.accent}33, #e11b2233, #3b82f633, ${cfg.accent}33)`,
                backgroundSize: '400% 400%',
                animation: 'holoShift 4s ease infinite',
              }}
            />
          )}

          {/* Card body */}
          <div
            className="w-full h-full flex flex-col"
            style={{ background: `linear-gradient(160deg, ${cfg.glow.replace('0.4', '0.15')} 0%, #0b0b0c 100%)` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="font-mono text-xs opacity-60" style={{ color: cfg.accent }}>
                #{String(card.numero).padStart(3, '0')}
              </span>
              <span className="text-sm" style={{ color: rCfg.color }}>
                {'★'.repeat(rCfg.stars)}
              </span>
            </div>

            {/* Artwork */}
            <div
              className="mx-4 mt-3 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                flex: '0 0 42%',
                background: `radial-gradient(circle at 50% 40%, ${cfg.accent}22 0%, transparent 70%)`,
                border: `1px solid ${cfg.accent}44`,
              }}
            >
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <pattern id={`zoom-grid-${card.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
                <rect width="100" height="100" fill={`url(#zoom-grid-${card.id})`} color={cfg.accent} />
              </svg>
              <span className="relative z-10 text-6xl">{cfg.icon}</span>
              <div className="absolute bottom-2 right-2 font-mono font-bold text-sm" style={{ color: cfg.accent }}>
                {card.potere} PWR
              </div>
            </div>

            {/* Name & element */}
            <div className="px-4 mt-4">
              <div className="font-display font-semibold text-base leading-tight text-[#f2ede4]"
                style={{ textShadow: `0 1px 8px ${cfg.glow}` }}>
                {card.nome}
              </div>
              <div className="uppercase tracking-widest opacity-60 mt-1 text-[10px]" style={{ color: cfg.accent }}>
                {card.elemento} · Kudjo Set I
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 mt-3" style={{ height: '0.5px', background: `${cfg.accent}44` }} />

            {/* Description */}
            <div className="px-4 mt-3 flex-1 text-[11px] leading-relaxed text-[#c4b89a] opacity-80 overflow-hidden">
              {card.descrizione}
            </div>

            {/* Footer */}
            <div className="px-4 pb-3 mt-auto flex items-center justify-between"
              style={{ borderTop: `0.5px solid ${cfg.accent}22` }}>
              <span className="text-[9px] uppercase tracking-widest opacity-40" style={{ color: cfg.accent }}>KUDJO TCG</span>
              <span className="text-[9px] opacity-40 text-[#f2ede4]">© 2026</span>
            </div>
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="flex flex-col gap-5 max-w-[200px] text-left">
          {/* Rarity badge */}
          <div
            className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border self-start"
            style={{ color: rCfg.color, borderColor: rCfg.color + '40', background: rCfg.color + '12' }}
          >
            {'★'.repeat(rCfg.stars)} {rCfg.label}
          </div>

          <div>
            <h2 className="text-2xl font-display font-light text-white leading-tight">{card.nome}</h2>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
              {card.elemento} · #{String(card.numero).padStart(3, '0')}
            </p>
          </div>

          {/* Power */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-600">Potere</span>
            <span className="text-2xl font-mono font-bold" style={{ color: cfg.accent, textShadow: `0 0 12px ${cfg.glow}` }}>
              {card.potere}
            </span>
            <span className="text-[9px] text-neutral-600 uppercase tracking-wider">PWR</span>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-300 leading-relaxed">{card.descrizione}</p>

          {/* Close hint */}
          <button
            onClick={onClose}
            className="mt-1 text-[10px] text-neutral-600 hover:text-neutral-400 uppercase tracking-widest transition-colors cursor-pointer text-left"
          >
            ← Chiudi · Premi Esc
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cardZoomEnter {
          0%   { opacity: 0; transform: scale(0.85) translateY(16px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .card-zoom-enter {
          animation: cardZoomEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes holoShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
