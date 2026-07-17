'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { type KudjoCard } from '@/lib/schema/kudjo-card';

const ELEMENTO_CONFIG: Record<string, { gradientFrom: string; gradientTo: string; accent: string; icon: string; glow: string }> = {
  fuoco:    { gradientFrom: '#3d0a0a', gradientTo: '#7a1a1a', accent: '#e11b22', icon: '🔥', glow: 'rgba(225,27,34,0.5)' },
  acqua:    { gradientFrom: '#0a1a3d', gradientTo: '#1a2e7a', accent: '#3b82f6', icon: '💧', glow: 'rgba(59,130,246,0.5)' },
  terra:    { gradientFrom: '#0a2212', gradientTo: '#1a4a1a', accent: '#22c55e', icon: '🌿', glow: 'rgba(34,197,94,0.5)' },
  ombra:    { gradientFrom: '#150a28', gradientTo: '#2d0f4a', accent: '#a855f7', icon: '🌑', glow: 'rgba(168,85,247,0.5)' },
  fulmine:  { gradientFrom: '#2a1f00', gradientTo: '#4a3800', accent: '#dfae0b', icon: '⚡', glow: 'rgba(223,174,11,0.5)' },
  ghiaccio: { gradientFrom: '#0a2233', gradientTo: '#0f3a4a', accent: '#22d3ee', icon: '❄️', glow: 'rgba(34,211,238,0.5)' },
  drago:    { gradientFrom: '#2a0a0a', gradientTo: '#5c1a1a', accent: '#f97316', icon: '🐉', glow: 'rgba(249,115,22,0.5)' },
  luce:     { gradientFrom: '#2a2510', gradientTo: '#4a4220', accent: '#fef08a', icon: '✨', glow: 'rgba(254,240,138,0.5)' },
};

const RARITA_CONFIG: Record<string, { label: string; color: string; border: string; badge: string; badgeText: string; stars: number }> = {
  comune:     { label: 'Comune',     color: '#888888', border: '#3a3a3a', badge: '#1f1f1f', badgeText: '#888888', stars: 1 },
  non_comune: { label: 'Non Comune', color: '#7ab8e8', border: '#4a6a8a', badge: '#1a2a3a', badgeText: '#7ab8e8', stars: 2 },
  raro:       { label: 'Raro',       color: '#dfae0b', border: '#8a6a00', badge: '#2a1f00', badgeText: '#dfae0b', stars: 3 },
};

interface CardZoomModalProps {
  card: KudjoCard;
  onClose: () => void;
}

export default function CardZoomModal({ card, onClose }: CardZoomModalProps) {
  const cfg  = ELEMENTO_CONFIG[card.elemento] ?? ELEMENTO_CONFIG.fuoco;
  const rCfg = RARITA_CONFIG[card.rarita]     ?? RARITA_CONFIG.comune;
  const isRaro = card.rarita === 'raro';
  const mounted = useRef(false);

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

  // Ensure we're mounted (for SSR safety)
  useEffect(() => { mounted.current = true; }, []);

  const modal = (
    <div
      className="kudjo-zoom-backdrop"
      onClick={onClose}
    >
      {/* Animated card container — pops out toward the user */}
      <div
        className="kudjo-zoom-container"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="kudjo-zoom-close"
          aria-label="Chiudi"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Enlarged Card ── */}
        <div
          className="kudjo-zoom-card"
          style={{
            border: `2px solid ${rCfg.border}`,
            boxShadow: isRaro
              ? `0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glow}, 0 30px 80px rgba(0,0,0,0.9)`
              : `0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Holo shimmer for rare */}
          {isRaro && (
            <div className="kudjo-zoom-holo" style={{
              background: `linear-gradient(135deg, ${cfg.accent}44, #e11b2244, #3b82f644, ${cfg.accent}44)`,
            }} />
          )}

          {/* Card content */}
          <div className="kudjo-zoom-card-inner"
            style={{ background: `linear-gradient(160deg, ${cfg.gradientFrom} 0%, ${cfg.gradientTo} 100%)` }}
          >
            {/* Header */}
            <div className="kudjo-zoom-header">
              <span className="kudjo-zoom-num" style={{ color: cfg.accent }}>
                #{String(card.numero).padStart(3, '0')}
              </span>
              <span className="kudjo-zoom-stars"
                style={{ background: rCfg.badge, color: rCfg.badgeText, border: `1px solid ${rCfg.border}` }}>
                {'★'.repeat(rCfg.stars)}
              </span>
            </div>

            {/* Artwork */}
            <div className="kudjo-zoom-art"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${cfg.accent}33 0%, transparent 70%)`,
                border: `1px solid ${cfg.accent}44`,
              }}
            >
              <svg className="kudjo-zoom-art-grid" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <pattern id={`zp-${card.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
                <rect width="100" height="100" fill={`url(#zp-${card.id})`} color={cfg.accent} />
              </svg>
              <span className="kudjo-zoom-icon">{cfg.icon}</span>
              <div className="kudjo-zoom-pwr" style={{ color: cfg.accent }}>
                {card.potere} <span style={{ fontSize: '10px', opacity: 0.7 }}>PWR</span>
              </div>
            </div>

            {/* Name */}
            <div className="kudjo-zoom-name-block">
              <div className="kudjo-zoom-name" style={{ textShadow: `0 2px 12px ${cfg.glow}` }}>
                {card.nome}
              </div>
              <div className="kudjo-zoom-sub" style={{ color: cfg.accent }}>
                {card.elemento} · Kudjo Set I
              </div>
            </div>

            {/* Divider */}
            <div className="kudjo-zoom-divider" style={{ background: `${cfg.accent}44` }} />

            {/* Description */}
            <div className="kudjo-zoom-desc">{card.descrizione}</div>

            {/* Footer */}
            <div className="kudjo-zoom-footer" style={{ borderTop: `0.5px solid ${cfg.accent}22` }}>
              <span style={{ color: cfg.accent }}>KUDJO TCG</span>
              <span style={{ color: '#f2ede4' }}>© 2026</span>
            </div>
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="kudjo-zoom-info">
          <div className="kudjo-zoom-rarity-badge"
            style={{ color: rCfg.color, borderColor: rCfg.color + '50', background: rCfg.color + '15' }}>
            {'★'.repeat(rCfg.stars)}&nbsp;&nbsp;{rCfg.label}
          </div>

          <div>
            <h2 className="kudjo-zoom-title">{card.nome}</h2>
            <p className="kudjo-zoom-meta">{card.elemento} · #{String(card.numero).padStart(3, '0')}</p>
          </div>

          <div className="kudjo-zoom-power-row">
            <span className="kudjo-zoom-power-label">Potere</span>
            <span className="kudjo-zoom-power-val" style={{ color: cfg.accent, textShadow: `0 0 16px ${cfg.glow}` }}>
              {card.potere}
            </span>
            <span className="kudjo-zoom-power-unit">PWR</span>
          </div>

          <p className="kudjo-zoom-long-desc">{card.descrizione}</p>

          <button onClick={onClose} className="kudjo-zoom-close-btn">
            ← Chiudi &nbsp;·&nbsp; Esc
          </button>
        </div>
      </div>

      <style>{`
        .kudjo-zoom-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: kzFadeIn 0.22s ease forwards;
        }
        @keyframes kzFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .kudjo-zoom-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          animation: kzPopUp 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @media (min-width: 640px) {
          .kudjo-zoom-container {
            flex-direction: row;
            gap: 48px;
          }
        }
        @keyframes kzPopUp {
          0%   { opacity: 0; transform: perspective(1000px) scale(0.4) translateZ(-300px) translateY(60px); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: perspective(1000px) scale(1) translateZ(0px)    translateY(0);   }
        }

        .kudjo-zoom-close {
          position: absolute;
          top: -18px;
          right: -18px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aaa;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .kudjo-zoom-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

        .kudjo-zoom-card {
          position: relative;
          flex-shrink: 0;
          border-radius: 14px;
          overflow: hidden;
          width: 312px;
          height: 437px;
        }

        .kudjo-zoom-holo {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          opacity: 0.25;
          background-size: 400% 400%;
          animation: holoShift 4s ease infinite;
        }
        @keyframes holoShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        .kudjo-zoom-card-inner {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .kudjo-zoom-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px 0;
        }
        .kudjo-zoom-num   { font-family: monospace; font-size: 13px; opacity: 0.65; }
        .kudjo-zoom-stars { font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 3px; letter-spacing: 1px; }

        .kudjo-zoom-art {
          margin: 8px 12px 0;
          border-radius: 8px;
          flex: 0 0 42%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .kudjo-zoom-art-grid {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.1;
        }
        .kudjo-zoom-icon { font-size: 72px; position: relative; z-index: 1; }
        .kudjo-zoom-pwr  {
          position: absolute;
          bottom: 8px;
          right: 10px;
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
        }

        .kudjo-zoom-name-block { padding: 10px 14px 0; }
        .kudjo-zoom-name {
          font-family: var(--font-fraunces, serif);
          font-size: 17px;
          font-weight: 600;
          color: #f2ede4;
          line-height: 1.2;
        }
        .kudjo-zoom-sub  { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.6; margin-top: 3px; }

        .kudjo-zoom-divider { margin: 8px 14px 0; height: 0.5px; }

        .kudjo-zoom-desc {
          padding: 8px 16px 0;
          flex: 1;
          font-size: 11px;
          line-height: 1.5;
          color: #c4b89a;
          opacity: 0.8;
          overflow: hidden;
        }

        .kudjo-zoom-footer {
          padding: 6px 14px;
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 7px;
          opacity: 0.4;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Info panel */
        .kudjo-zoom-info {
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-width: 200px;
          text-align: left;
        }

        .kudjo-zoom-rarity-badge {
          display: inline-flex;
          align-items: center;
          font-size: 9px;
          font-weight: bold;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid;
          align-self: flex-start;
        }

        .kudjo-zoom-title {
          font-family: var(--font-fraunces, serif);
          font-size: 22px;
          font-weight: 300;
          color: #fff;
          line-height: 1.2;
          margin: 0;
        }
        .kudjo-zoom-meta {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: 4px;
        }

        .kudjo-zoom-power-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .kudjo-zoom-power-label { font-size: 9px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: #444; }
        .kudjo-zoom-power-val   { font-size: 28px; font-family: monospace; font-weight: bold; line-height: 1; }
        .kudjo-zoom-power-unit  { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.1em; }

        .kudjo-zoom-long-desc {
          font-size: 13px;
          color: #bbb;
          line-height: 1.65;
          margin: 0;
        }

        .kudjo-zoom-close-btn {
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
          text-align: left;
        }
        .kudjo-zoom-close-btn:hover { color: #aaa; }
      `}</style>
    </div>
  );

  // Render into body via Portal to escape any overflow:hidden parent
  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
