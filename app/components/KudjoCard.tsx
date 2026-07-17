'use client';

import React, { useState, useRef } from 'react';
import { type KudjoCard } from '@/lib/schema/kudjo-card';
import CardZoomModal from './CardZoomModal';

interface KudjoCardProps {
  card: KudjoCard;
  /** Se true, la carta mostra il retro (non rivelata) */
  faceDown?: boolean;
  /** Dimensione small per griglia, normal per modal */
  size?: 'small' | 'normal' | 'large';
  /** Count duplicati da mostrare sul badge */
  duplicates?: number;
  /** Se true, disabilita il click-to-zoom (es. durante animazioni) */
  disableZoom?: boolean;
}

// ─── Configurazione visiva per elemento ────────────────────────────────────

const ELEMENTO_CONFIG: Record<string, {
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  icon: string;
  glow: string;
}> = {
  fuoco:    { gradientFrom: '#3d0a0a', gradientTo: '#7a1a1a', accent: '#e11b22', icon: '🔥', glow: 'rgba(225,27,34,0.4)' },
  acqua:    { gradientFrom: '#0a1a3d', gradientTo: '#1a2e7a', accent: '#3b82f6', icon: '💧', glow: 'rgba(59,130,246,0.4)' },
  terra:    { gradientFrom: '#0a2212', gradientTo: '#1a4a1a', accent: '#22c55e', icon: '🌿', glow: 'rgba(34,197,94,0.4)'  },
  ombra:    { gradientFrom: '#150a28', gradientTo: '#2d0f4a', accent: '#a855f7', icon: '🌑', glow: 'rgba(168,85,247,0.4)' },
  fulmine:  { gradientFrom: '#2a1f00', gradientTo: '#4a3800', accent: '#dfae0b', icon: '⚡', glow: 'rgba(223,174,11,0.4)' },
  ghiaccio: { gradientFrom: '#0a2233', gradientTo: '#0f3a4a', accent: '#22d3ee', icon: '❄️', glow: 'rgba(34,211,238,0.4)' },
  drago:    { gradientFrom: '#2a0a0a', gradientTo: '#5c1a1a', accent: '#f97316', icon: '🐉', glow: 'rgba(249,115,22,0.4)'  },
  luce:     { gradientFrom: '#2a2510', gradientTo: '#4a4220', accent: '#fef08a', icon: '✨', glow: 'rgba(254,240,138,0.4)' },
};

const RARITA_CONFIG: Record<string, {
  label: string;
  labelEn: string;
  border: string;
  badge: string;
  badgeText: string;
  stars: number;
}> = {
  comune:     { label: 'Comune',     labelEn: 'Common',    border: '#3a3a3a', badge: '#1f1f1f', badgeText: '#888888', stars: 1 },
  non_comune: { label: 'Non Comune', labelEn: 'Uncommon',  border: '#4a6a8a', badge: '#1a2a3a', badgeText: '#7ab8e8', stars: 2 },
  raro:       { label: 'Raro',       labelEn: 'Rare',      border: '#8a6a00', badge: '#2a1f00', badgeText: '#dfae0b', stars: 3 },
};

// ─── Decorative SVG pattern for card back ──────────────────────────────────
function CardBack({ size }: { size: string }) {
  const dim = size === 'small' ? 120 : size === 'large' ? 260 : 200;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f0e0c 0%, #1a1713 50%, #0f0e0c 100%)',
      }}
    >
      <svg width={dim * 0.65} height={dim * 0.9} viewBox="0 0 130 180" fill="none">
        {/* Outer border */}
        <rect x="2" y="2" width="126" height="176" rx="8" stroke="#dfae0b" strokeWidth="1.5" strokeOpacity="0.6" />
        {/* Inner border */}
        <rect x="8" y="8" width="114" height="164" rx="5" stroke="#dfae0b" strokeWidth="0.8" strokeOpacity="0.3" />
        {/* K Logo central */}
        <text x="65" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="52" fontWeight="bold" fill="#dfae0b" fillOpacity="0.8" fontFamily="serif">K</text>
        {/* Decorative lines */}
        <line x1="20" y1="30" x2="110" y2="30" stroke="#dfae0b" strokeOpacity="0.2" strokeWidth="0.5" />
        <line x1="20" y1="150" x2="110" y2="150" stroke="#dfae0b" strokeOpacity="0.2" strokeWidth="0.5" />
        {/* Corner ornaments */}
        <circle cx="18" cy="18" r="3" fill="#dfae0b" fillOpacity="0.4" />
        <circle cx="112" cy="18" r="3" fill="#dfae0b" fillOpacity="0.4" />
        <circle cx="18" cy="162" r="3" fill="#dfae0b" fillOpacity="0.4" />
        <circle cx="112" cy="162" r="3" fill="#dfae0b" fillOpacity="0.4" />
        {/* Kudjo text */}
        <text x="65" y="135" textAnchor="middle" fontSize="9" fill="#dfae0b" fillOpacity="0.5" letterSpacing="4" fontFamily="sans-serif">KUDJO</text>
        <text x="65" y="148" textAnchor="middle" fontSize="6" fill="#dfae0b" fillOpacity="0.35" letterSpacing="2" fontFamily="sans-serif">ORIGINAL SET I</text>
      </svg>
    </div>
  );
}

// ─── Main Card Component ────────────────────────────────────────────────────

export default function KudjoCard({ card, faceDown = false, size = 'normal', duplicates, disableZoom = false }: KudjoCardProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [sheenStyle, setSheenStyle] = useState<React.CSSProperties>({});
  const [zoomOpen, setZoomOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cfg  = ELEMENTO_CONFIG[card.elemento] ?? ELEMENTO_CONFIG.fuoco;
  const rCfg = RARITA_CONFIG[card.rarita]     ?? RARITA_CONFIG.comune;
  const isRaro = card.rarita === 'raro';

  const sizeClasses = {
    small:  'w-[100px] h-[140px] text-[7px]',
    normal: 'w-[160px] h-[224px] text-[9px]',
    large:  'w-[240px] h-[336px] text-[11px]',
  }[size];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (faceDown) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top)  / rect.height;
    const rotateX = (0.5 - py) * 18;
    const rotateY = (px - 0.5) * 18;
    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05,1.05,1.05)`,
      transition: 'transform 0.05s ease-out',
    });
    if (isRaro) {
      setSheenStyle({
        background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(223,174,11,0.5) 0%, rgba(249,115,22,0.2) 30%, rgba(0,0,0,0) 70%)`,
        opacity: 1,
        transition: 'opacity 0.1s ease',
      });
    } else {
      setSheenStyle({
        background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 60%)`,
        opacity: 0.8,
        transition: 'opacity 0.1s ease',
      });
    }
  };

  const handleMouseLeave = () => {
    setStyle({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)', transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' });
    setSheenStyle({ opacity: 0, transition: 'opacity 0.5s ease' });
  };

  return (
    <div
      ref={cardRef}
      className={`relative flex-shrink-0 rounded-lg overflow-hidden select-none cursor-pointer ${sizeClasses}`}
      style={{
        border: `1.5px solid ${rCfg.border}`,
        boxShadow: isRaro ? `0 0 20px ${cfg.glow}, 0 0 40px ${cfg.glow}` : `0 4px 12px rgba(0,0,0,0.6)`,
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => { if (!faceDown && !disableZoom) setZoomOpen(true); }}
    >
      {/* Sheen overlay */}
      <div className="absolute inset-0 z-30 pointer-events-none rounded-lg mix-blend-color-dodge" style={sheenStyle} />

      {/* Rare holographic animated background */}
      {isRaro && !faceDown && (
        <div
          className="absolute inset-0 z-10 pointer-events-none opacity-20"
          style={{
            background: 'linear-gradient(135deg, #dfae0b22, #e11b2222, #3b82f622, #dfae0b22)',
            backgroundSize: '400% 400%',
            animation: 'holoShift 4s ease infinite',
          }}
        />
      )}

      {faceDown ? (
        <CardBack size={size} />
      ) : (
        <div
          className="w-full h-full flex flex-col"
          style={{ background: `linear-gradient(160deg, ${cfg.gradientFrom} 0%, ${cfg.gradientTo} 100%)` }}
        >
          {/* Header: numero + rarità */}
          <div className="flex items-center justify-between px-[6%] pt-[4%]">
            <span className="font-mono opacity-60" style={{ color: cfg.accent, fontSize: size === 'small' ? '6px' : '8px' }}>
              #{String(card.numero).padStart(3, '0')}
            </span>
            <span
              className="px-1 rounded font-bold tracking-wider uppercase"
              style={{
                background: rCfg.badge,
                color: rCfg.badgeText,
                border: `0.5px solid ${rCfg.border}`,
                fontSize: size === 'small' ? '5px' : '7px',
              }}
            >
              {'★'.repeat(rCfg.stars)}
            </span>
          </div>

          {/* Central artwork area */}
          <div
            className="mx-[8%] mt-[4%] rounded flex items-center justify-center relative overflow-hidden"
            style={{
              flex: '0 0 42%',
              background: `radial-gradient(circle at 50% 40%, ${cfg.accent}22 0%, transparent 70%)`,
              border: `1px solid ${cfg.accent}33`,
            }}
          >
            {/* Background pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              <pattern id={`grid-${card.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100" height="100" fill={`url(#grid-${card.id})`} color={cfg.accent} />
            </svg>

            {/* Main element icon */}
            <span
              style={{ fontSize: size === 'small' ? '24px' : size === 'large' ? '56px' : '38px' }}
              className="relative z-10"
            >
              {cfg.icon}
            </span>

            {/* Power badge */}
            <div
              className="absolute bottom-1 right-1 font-mono font-bold"
              style={{
                color: cfg.accent,
                fontSize: size === 'small' ? '6px' : '8px',
                textShadow: `0 0 8px ${cfg.glow}`,
              }}
            >
              {card.potere} PWR
            </div>
          </div>

          {/* Card name */}
          <div className="px-[8%] mt-[5%]">
            <div
              className="font-display font-semibold leading-tight"
              style={{
                color: '#f2ede4',
                fontSize: size === 'small' ? '7px' : size === 'large' ? '14px' : '10px',
                textShadow: `0 1px 6px ${cfg.glow}`,
              }}
            >
              {card.nome}
            </div>
            <div
              className="uppercase tracking-widest opacity-60 mt-[2px]"
              style={{
                color: cfg.accent,
                fontSize: size === 'small' ? '5px' : size === 'large' ? '9px' : '7px',
              }}
            >
              {card.elemento} · Kudjo Set I
            </div>
          </div>

          {/* Divider */}
          <div className="mx-[8%] mt-[4%]" style={{ height: '0.5px', background: `${cfg.accent}44` }} />

          {/* Description */}
          <div
            className="px-[8%] mt-[4%] flex-1 leading-relaxed opacity-70"
            style={{
              color: '#c4b89a',
              fontSize: size === 'small' ? '5px' : size === 'large' ? '9px' : '7px',
              display: size === 'small' ? 'none' : undefined,
              overflow: 'hidden',
            }}
          >
            {card.descrizione}
          </div>

          {/* Footer */}
          <div
            className="px-[8%] pb-[4%] mt-auto flex items-center justify-between"
            style={{ borderTop: `0.5px solid ${cfg.accent}22` }}
          >
            <span className="opacity-40 tracking-widest uppercase" style={{ color: cfg.accent, fontSize: size === 'small' ? '4px' : '6px' }}>
              KUDJO TCG
            </span>
            <span className="opacity-40" style={{ color: '#f2ede4', fontSize: size === 'small' ? '4px' : '6px' }}>
              © 2026
            </span>
          </div>
        </div>
      )}

      {/* Duplicate badge */}
      {duplicates && duplicates > 1 && (
        <div className="absolute top-1 right-1 z-40 bg-black/80 text-[#dfae0b] font-bold rounded-full w-4 h-4 flex items-center justify-center text-[8px] border border-[#dfae0b]/40">
          ×{duplicates}
        </div>
      )}

      {/* Zoom hint on hover (only when zoomable) */}
      {!faceDown && !disableZoom && (
        <div className="absolute inset-0 z-50 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-lg">
          <span className="text-[7px] font-bold tracking-widest uppercase bg-black/70 text-white/60 px-2 py-0.5 rounded-full">
            🔍 Ingrandisci
          </span>
        </div>
      )}

      {/* Card Zoom Modal */}
      {zoomOpen && (
        <CardZoomModal card={card} onClose={() => setZoomOpen(false)} />
      )}
    </div>
  );
}
