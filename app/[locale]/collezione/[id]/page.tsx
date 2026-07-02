'use client';

import React, { use, useState, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getItemById } from '@/lib/data/mock-db';
import { SOGLIA_PREZZO_PUBBLICO } from '@/lib/config';

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('Detail');
  const tCommon = useTranslations('Common');
  const tCol = useTranslations('Collection');

  // Retrieve item
  const populatedItem = useMemo(() => getItemById(id), [id]);

  // Form States
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Gallery state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Tilt Card state for main view
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [sheenStyle, setSheenStyle] = useState<React.CSSProperties>({});
  const [angledOpacity, setAngledOpacity] = useState(0);
  const mainCardRef = React.useRef<HTMLDivElement>(null);

  if (!populatedItem) {
    notFound();
  }

  const { item, variant, card, set } = populatedItem;

  const hasAngledPhoto = item.foto && item.foto.length >= 2;
  const currentPhoto = item.foto[selectedPhotoIndex] || '/images/cards/placeholder_front.jpg';

  // Format price
  const formattedPrice =
    item.prezzo >= SOGLIA_PREZZO_PUBBLICO
      ? tCommon('priceOnRequest')
      : `${item.prezzo}${tCommon('currencySymbol')}`;

  // Default pre-filled message
  const defaultMessage = t('form.messageDefault')
    .replace('{cardName}', card.nome)
    .replace('{collectNo}', card.numero_raccolta)
    .replace('{setName}', set.nome);

  // Handle standard form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contatti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: name,
          contatto: contact,
          messaggio: message || defaultMessage,
          item_riferimento: item.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setName('');
        setContact('');
        setMessage('');
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate pre-filled WhatsApp link
  const getWhatsAppLink = () => {
    const textMsg = encodeURIComponent(
      `${tCommon('languages.it') === 'Italiano' ? '*Richiesta Info Kudjo*' : '*Kudjo Info Request*'}\n` +
      `*Card:* ${card.nome} (${card.numero_raccolta})\n` +
      `*Set:* ${set.nome}\n` +
      `*Price:* ${item.prezzo >= SOGLIA_PREZZO_PUBBLICO ? 'Su richiesta' : item.prezzo + '€'}\n\n` +
      `${message || defaultMessage}`
    );
    // Standard international WhatsApp link
    return `https://wa.me/393330000000?text=${textMsg}`; // Placeholder number, standard format
  };

  // Generate pre-filled Email link
  const getEmailLink = () => {
    const subject = encodeURIComponent(`Kudjo - Info Request: ${card.nome} (${card.numero_raccolta})`);
    const body = encodeURIComponent(
      `Name: ${name || 'Collector'}\n` +
      `Contact: ${contact || 'Not provided'}\n\n` +
      `${message || defaultMessage}`
    );
    return `mailto:info@kudjo.shop?subject=${subject}&body=${body}`;
  };

  // 3D Tilt handlers for the large main details image
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardEl = mainCardRef.current;
    if (!cardEl) return;

    // Apply tilt only if we are displaying the front image which supports the olographic overlay
    const isFrontPhoto = selectedPhotoIndex === 0;

    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = x / rect.width;
    const py = y / rect.height;

    const rotateX = (0.5 - py) * 14;
    const rotateY = (px - 0.5) * 14;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.05s ease-out',
    });

    if (isFrontPhoto) {
      let sheenGradient = '';
      if (variant.tipo_variante === 'manga_art' || variant.tipo_variante === 'secret_rare') {
        sheenGradient = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(212, 175, 55, 0.3) 0%, rgba(139, 69, 19, 0.05) 50%, rgba(0,0,0,0) 80%)`;
      } else {
        sheenGradient = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255, 255, 255, 0.2) 0%, rgba(0, 128, 255, 0.05) 55%, rgba(0, 0, 0, 0) 80%)`;
      }

      setSheenStyle({
        background: sheenGradient,
        opacity: 0.7,
        transition: 'opacity 0.1s ease',
      });

      if (hasAngledPhoto) {
        const tiltAngle = Math.sqrt(rotateX * rotateX + rotateY * rotateY);
        const opacity = Math.min(1, Math.max(0, (tiltAngle - 1.5) / 8));
        setAngledOpacity(opacity);
      }
    }
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease',
    });
    setSheenStyle({
      opacity: 0,
      transition: 'opacity 0.5s ease',
    });
    setAngledOpacity(0);
  };

  // Badge mapping
  const statusColors = {
    disponibile: 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400',
    riservata: 'border-amber-900/30 bg-amber-950/20 text-amber-400',
    venduta: 'border-neutral-900/30 bg-neutral-950/40 text-neutral-400',
  };

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans py-12 md:py-20">
      <div className="absolute top-0 left-10 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Back Link */}
        <Link
          href="/collezione"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-500 hover:text-foreground transition-colors mb-8 md:mb-12 group"
        >
          <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>
          {tCommon('back')}
        </Link>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* LEFT COLUMN: Gallery & Interactive Visuals */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Interactive Tilt card container */}
            <div
              ref={mainCardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-[7/10] w-full overflow-hidden rounded-2xl border border-white/5 bg-[#121214] p-4 shadow-2xl transition-all duration-300 hover:border-bronze/20 cursor-grab"
              style={tiltStyle}
            >
              {/* Olographic Overlay sheen */}
              <div
                className="pointer-events-none absolute inset-0 z-30 mix-blend-color-dodge rounded-2xl"
                style={sheenStyle}
              />

              {/* Card Image */}
              <Image
                src={currentPhoto}
                alt={card.nome}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain p-2"
                priority
              />

              {/* Angled holographic card photo (fades in on tilt when front selected) */}
              {selectedPhotoIndex === 0 && hasAngledPhoto && item.foto[1] && (
                <Image
                  src={item.foto[1]}
                  alt={`${card.nome} holo`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain p-2 mix-blend-lighten pointer-events-none"
                  style={{
                    opacity: angledOpacity,
                    transition: 'opacity 0.05s ease-out',
                  }}
                />
              )}

              {/* Status Badge */}
              <div className={`absolute top-4 right-4 z-20 rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-sm ${statusColors[item.stato]}`}>
                {tCol(`statusLabels.${item.stato}`)}
              </div>
            </div>

            {/* Olographic Interaction hint note */}
            {selectedPhotoIndex === 0 && hasAngledPhoto && (
              <p className="text-[11px] text-neutral-500 text-center italic tracking-wide">
                ✨ {t('dualPhotoNote')}
              </p>
            )}

            {/* Gallery Thumbnails */}
            {item.foto && item.foto.length > 1 && (
              <div className="flex gap-4 justify-center">
                {item.foto.map((photo, index) => {
                  let label = 'Front';
                  if (index === 1 && hasAngledPhoto) label = 'Tilt';
                  else if (index === 2 || (index === 1 && !hasAngledPhoto)) label = 'Back';

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`relative h-16 w-12 rounded border overflow-hidden bg-neutral-900 transition-all cursor-pointer ${
                        selectedPhotoIndex === index
                          ? 'border-bronze shadow-[0_0_8px_rgba(156,122,82,0.3)]'
                          : 'border-white/5 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={photo}
                        alt={`${card.nome} thumb ${index}`}
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] font-bold tracking-widest uppercase py-0.5 text-center text-white/80">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Specifications, History & Contact form */}
          <div className="lg:col-span-7 flex flex-col gap-8 md:gap-10">
            {/* Title Section */}
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-wider uppercase text-neutral-500 mb-2">
                <span>{set.nome}</span>
                <span>•</span>
                <span>{set.codice_ufficiale} · {card.numero_raccolta}</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl text-foreground font-light mb-4">
                {card.nome}
              </h1>

              {/* Price Tag */}
              <div className="flex items-baseline gap-4 mt-2">
                <span className="text-sm text-neutral-500">
                  {tCommon('languages.it') === 'Italiano' ? 'Quotazione Stima:' : 'Estimated Value:'}
                </span>
                <span className={`font-mono text-2xl font-semibold tracking-tight ${item.prezzo >= SOGLIA_PREZZO_PUBBLICO ? 'text-bronze italic text-lg' : 'text-foreground'}`}>
                  {formattedPrice}
                </span>
              </div>
            </div>

            {/* Specifications Card Grid */}
            <div className="border border-white/5 bg-white/[0.01] rounded-xl p-6 md:p-8">
              <h3 className="text-xs font-bold tracking-widest uppercase text-foreground mb-4 pb-2 border-b border-white/5">
                {t('details')}
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs">
                <div className="flex justify-between border-b border-white/[0.02] pb-2">
                  <span className="text-neutral-500">{t('game')}</span>
                  <span className="font-semibold text-neutral-300 capitalize">
                    {set.gioco === 'pokemon' ? 'Pokémon TCG' : 'One Piece TCG'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-2">
                  <span className="text-neutral-500">{t('printingLang')}</span>
                  <span className="font-semibold text-neutral-300 uppercase">{card.lingua_stampa}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-2">
                  <span className="text-neutral-500">{t('rarity')}</span>
                  <span className="font-semibold text-neutral-300">{card.rarita}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-2">
                  <span className="text-neutral-500">{t('condition')}</span>
                  <span className="font-semibold text-neutral-300">{item.condizione_raw} (Near Mint)</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-2">
                  <span className="text-neutral-500">{t('variant')}</span>
                  <span className="font-semibold text-neutral-300 capitalize">{variant.tipo_variante.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-2">
                  <span className="text-neutral-500">{t('grading')}</span>
                  <span className="font-semibold text-neutral-300">
                    {item.gradata ? `${item.grading_company} ${item.voto}` : 'Raw (Non Gradata)'}
                  </span>
                </div>
              </div>
            </div>

            {/* History and Provenance */}
            {item.nota_storia && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold tracking-widest uppercase text-foreground">
                  {t('historyTitle')}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 italic bg-white/[0.01] border border-white/5 p-4 rounded-lg">
                  &ldquo;{item.nota_storia}&rdquo;
                </p>
              </div>
            )}

            {/* Inquiry Form */}
            {item.stato !== 'venduta' && (
              <div className="border border-bronze/25 bg-bronze/5 rounded-xl p-6 md:p-8">
                <h3 className="font-display text-lg text-bronze mb-2">
                  {t('inquireTitle')}
                </h3>
                <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                  {t('inquireDesc')}
                </p>

                {submitSuccess ? (
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/30 p-6 text-center animate-fade-in">
                    <svg className="mx-auto h-8 w-8 text-emerald-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-sm font-bold text-emerald-400 mb-1">{tCommon('success')}</h4>
                    <p className="text-xs text-neutral-500">{tCommon('disclaimer')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                          {t('form.name')}
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="rounded border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-foreground focus:border-bronze focus:outline-none"
                        />
                      </div>

                      {/* Contact */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                          {t('form.contact')}
                        </label>
                        <input
                          type="text"
                          required
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          className="rounded border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-foreground focus:border-bronze focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                        {t('form.message')}
                      </label>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={defaultMessage}
                        className="rounded border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-foreground focus:border-bronze focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                      {/* General inquiry submission via API */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded bg-bronze py-3 text-xs font-bold tracking-widest uppercase text-[#0b0b0c] hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer sm:col-span-1"
                      >
                        {isSubmitting ? tCommon('loading') : t('form.submit')}
                      </button>

                      {/* WhatsApp direct click-to-chat */}
                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-emerald-500/30 bg-emerald-950/15 py-3 text-center text-xs font-bold tracking-widest uppercase text-emerald-400 hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:col-span-1"
                      >
                        {/* WhatsApp icon */}
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.774 9.774 0 00-6.978-2.879c-5.434 0-9.858 4.37-9.862 9.8-.001 1.762.463 3.484 1.347 5.015L1.81 22.113l4.837-1.259zM17.06 14.88c-.277-.139-1.643-.809-1.897-.901-.253-.093-.438-.139-.623.139-.184.278-.716.901-.877 1.087-.162.186-.323.208-.6.069-.278-.139-1.171-.43-2.23-1.374-.825-.733-1.38-1.64-1.543-1.918-.162-.278-.017-.428.122-.566.125-.124.277-.323.416-.486.139-.162.185-.278.277-.463.093-.185.046-.347-.023-.486-.069-.139-.623-1.505-.854-2.06-.225-.541-.453-.467-.623-.476-.162-.009-.347-.01-.531-.01-.184 0-.485.069-.739.347-.254.278-.97.949-.97 2.315 0 1.367.997 2.687 1.136 2.873.139.186 1.961 2.996 4.75 4.2.663.286 1.18.457 1.583.585.667.212 1.274.182 1.754.11.535-.08 1.643-.672 1.874-1.321.23-.649.23-1.205.162-1.321-.069-.116-.254-.185-.531-.324z" />
                        </svg>
                        WhatsApp
                      </a>

                      {/* Email direct click-to-email */}
                      <a
                        href={getEmailLink()}
                        className="rounded border border-white/10 bg-white/5 py-3 text-center text-xs font-bold tracking-widest uppercase text-foreground hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:col-span-1"
                      >
                        {/* Mail icon */}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </a>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
