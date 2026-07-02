'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { type PopulatedItem } from '@/lib/data/mock-db';
import { SOGLIA_PREZZO_PUBBLICO } from '@/lib/config';
import { useTranslations } from 'next-intl';

interface HoloCardProps {
  populatedItem: PopulatedItem;
}

export default function HoloCard({ populatedItem }: HoloCardProps) {
  const t = useTranslations('Common');
  const tCol = useTranslations('Collection');
  const { item, variant, card, set } = populatedItem;

  const [style, setStyle] = useState<React.CSSProperties>({});
  const [sheenStyle, setSheenStyle] = useState<React.CSSProperties>({});
  const [angledOpacity, setAngledOpacity] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const hasAngledPhoto = item.foto && item.foto.length >= 2;
  const mainPhoto = item.foto && item.foto.length > 0 ? item.foto[0] : '/images/cards/placeholder_front.jpg';
  const angledPhoto = hasAngledPhoto ? item.foto[1] : null;

  // Formatting price
  const formattedPrice =
    item.prezzo >= SOGLIA_PREZZO_PUBBLICO
      ? t('priceOnRequest')
      : `${item.prezzo}${t('currencySymbol')}`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top;  //y position within the element.

    const px = x / rect.width;
    const py = y / rect.height;

    // Calculate rotation (-15deg to 15deg)
    const rotateX = (0.5 - py) * 20;
    const rotateY = (px - 0.5) * 20;

    // Calculate sheen gradient position
    const sheenX = px * 100;
    const sheenY = py * 100;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`,
      transition: 'transform 0.05s ease-out',
    });

    // Color gradient shifts based on cursor. Gold/bronze for premium feel.
    let sheenGradient = '';
    if (variant.tipo_variante === 'manga_art' || variant.tipo_variante === 'secret_rare') {
      sheenGradient = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(212, 175, 55, 0.4) 0%, rgba(139, 69, 19, 0.1) 40%, rgba(0,0,0,0) 80%)`;
    } else if (variant.tipo_variante === 'holo' || variant.tipo_variante === 'alternate_art') {
      // Holographic rainbow gradient
      sheenGradient = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 0, 128, 0.1) 25%, rgba(0, 128, 255, 0.1) 50%, rgba(0, 0, 0, 0) 80%)`;
    } else {
      // Clean silver-grey reflections
      sheenGradient = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0) 80%)`;
    }

    setSheenStyle({
      background: sheenGradient,
      opacity: 0.85,
      transition: 'opacity 0.1s ease',
    });

    if (hasAngledPhoto) {
      // Calculate opacity of angled olographic photo based on tilt degree
      const tiltAngle = Math.sqrt(rotateX * rotateX + rotateY * rotateY);
      // Fades in starting from 3 degrees tilt up to 15 degrees max
      const opacity = Math.min(1, Math.max(0, (tiltAngle - 2) / 10));
      setAngledOpacity(opacity);
    }
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    });
    setSheenStyle({
      opacity: 0,
      transition: 'opacity 0.5s ease',
    });
    setAngledOpacity(0);
  };

  // Touch handlers for mobile devices
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const cardEl = cardRef.current;
    if (!cardEl || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = cardEl.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      handleMouseLeave();
      return;
    }

    const px = x / rect.width;
    const py = y / rect.height;

    const rotateX = (0.5 - py) * 16;
    const rotateY = (px - 0.5) * 16;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.05s ease-out',
    });

    setSheenStyle({
      background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 60%)`,
      opacity: 0.6,
      transition: 'opacity 0.1s ease',
    });

    if (hasAngledPhoto) {
      const tiltAngle = Math.sqrt(rotateX * rotateX + rotateY * rotateY);
      const opacity = Math.min(1, Math.max(0, (tiltAngle - 2) / 8));
      setAngledOpacity(opacity);
    }
  };

  // Badges color mapping
  const statusColors = {
    disponibile: 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400',
    riservata: 'border-amber-900/30 bg-amber-950/20 text-amber-400',
    venduta: 'border-neutral-900/30 bg-neutral-950/40 text-neutral-400',
  };

  const gameColors = {
    pokemon: 'border-blue-900/30 bg-blue-950/10 text-blue-400',
    one_piece: 'border-red-900/30 bg-red-950/10 text-red-400',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#121214] p-3 shadow-2xl transition-all duration-300 hover:border-bronze/40 hover:shadow-[0_0_30px_rgba(156,122,82,0.15)] select-none cursor-pointer"
      style={style}
    >
      {/* 3D Reflection Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-30 mix-blend-color-dodge rounded-xl"
        style={sheenStyle}
      />

      {/* Card Image Container */}
      <div className="relative aspect-[7/10] w-full overflow-hidden rounded-lg bg-neutral-900">
        {/* Main straight photo */}
        <Image
          src={mainPhoto}
          alt={`${card.nome} front`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-1 transition-transform duration-500 group-hover:scale-[1.01]"
          priority
        />

        {/* Angled holographic photo (fades in as card tilts) */}
        {hasAngledPhoto && angledPhoto && (
          <Image
            src={angledPhoto}
            alt={`${card.nome} olographic`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-1 mix-blend-lighten pointer-events-none"
            style={{
              opacity: angledOpacity,
              transition: 'opacity 0.05s ease-out',
            }}
          />
        )}

        {/* Gradazione/PSA Tag overlay */}
        {item.gradata && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded bg-[#0b0b0c]/90 px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-bronze border border-bronze/20">
            <span>{item.grading_company}</span>
            <span className="bg-bronze text-[#0b0b0c] px-1 rounded-sm ml-0.5">{item.voto}</span>
          </div>
        )}

        {/* Status Tag */}
        <div className={`absolute top-2 right-2 z-20 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase backdrop-blur-sm ${statusColors[item.stato]}`}>
          {tCol(`statusLabels.${item.stato}`)}
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-4 flex flex-1 flex-col justify-between gap-2 px-1">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
              {set.codice_ufficiale} · {card.numero_raccolta}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold font-sans ${gameColors[set.gioco]}`}>
              {set.gioco === 'pokemon' ? 'Pokémon' : 'One Piece'}
            </span>
          </div>

          <h3 className="mt-1 font-display text-lg text-foreground line-clamp-1 group-hover:text-bronze transition-colors">
            {card.nome}
          </h3>

          <div className="mt-0.5 flex flex-wrap gap-1 items-center text-[11px] text-neutral-400">
            <span>{variant.note || variant.tipo_variante}</span>
            {card.lingua_stampa && (
              <>
                <span className="text-neutral-600">•</span>
                <span className="uppercase font-medium text-neutral-500">{card.lingua_stampa}</span>
              </>
            )}
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-500">{item.condizione_raw}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-xs text-neutral-500">
            {item.stato === 'venduta' ? '' : t('tagline')}
          </span>
          <span className={`font-mono text-sm font-semibold tracking-tight ${item.prezzo >= SOGLIA_PREZZO_PUBBLICO ? 'text-bronze italic text-xs' : 'text-foreground'}`}>
            {item.stato === 'venduta' ? '—' : formattedPrice}
          </span>
        </div>
      </div>
    </div>
  );
}
