'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { type Gioco } from '@/lib/schema/gioco';

export default function VendiciCartaPage() {
  const t = useTranslations('Sell');
  const tCommon = useTranslations('Common');

  // Form State
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [game, setGame] = useState<Gioco>('pokemon');
  const [cardDesc, setCardDesc] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Image Upload State
  const [foto, setFoto] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  // Values passed to redirect links after success
  const [submittedName, setSubmittedName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert(tCommon('languages.it') === 'Italiano' 
        ? 'Il file è troppo grande. Dimensione massima 5MB.' 
        : 'File is too large. Maximum size is 5MB.');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFoto('');
    setFileName(null);
    setFileSize(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmittedName(name);

    try {
      const response = await fetch('/api/contatti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: name,
          contatto: contact,
          gioco: game,
          descrizione_carta: cardDesc,
          messaggio: message,
          foto: foto || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setName('');
        setContact('');
        setCardDesc('');
        setMessage('');
        setFoto('');
        setFileName(null);
        setFileSize(null);
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppPhotoLink = () => {
    const textMsg = encodeURIComponent(
      `${tCommon('languages.it') === 'Italiano' ? '*Invio Foto Proposta Kudjo*' : '*Kudjo Proposal Photos Submission*'}\n` +
      `*Name:* ${submittedName}\n` +
      `*Game:* ${game === 'pokemon' ? 'Pokémon' : 'One Piece'}\n\n` +
      `${tCommon('languages.it') === 'Italiano' ? 'Ecco le foto fronte/retro del pezzo proposto.' : 'Here are the front/back photos of the proposed card.'}`
    );
    return `https://wa.me/393330000000?text=${textMsg}`;
  };

  const getEmailPhotoLink = () => {
    const subject = encodeURIComponent(`Kudjo Proposal Photos - ${submittedName}`);
    const body = encodeURIComponent(
      `Hello,\nhere are the detailed front/back photos for the card proposed by ${submittedName}.\nGame: ${game === 'pokemon' ? 'Pokémon' : 'One Piece'}\n`
    );
    return `mailto:info@kudjo.shop?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans py-16 md:py-24">
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-2xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
            Acquisto Diretto
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Intro Banner */}
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 mb-8 text-xs leading-relaxed text-neutral-400">
          <p className="mb-4">{t('intro')}</p>
          <p className="text-neutral-500 italic bg-white/[0.01] border-l-2 border-bronze/60 pl-3 py-1">
            ⚠️ {t('instructions')}
          </p>
        </div>

        {/* Success screen or Form */}
        {submitSuccess ? (
          <div className="rounded-xl border border-bronze/25 bg-bronze/5 p-8 text-center animate-fade-in">
            {/* Success icon */}
            <svg className="mx-auto h-12 w-12 text-bronze mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-display text-2xl text-foreground font-light mb-2">
              {t('success.title')}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              {t('success.desc')}
            </p>

            <div className="border-t border-white/5 pt-6 max-w-md mx-auto">
              <p className="text-xs text-neutral-400 font-semibold mb-4 leading-normal">
                {t('success.ctaText')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={getWhatsAppPhotoLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold tracking-wider uppercase text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {/* WhatsApp SVG */}
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.774 9.774 0 00-6.978-2.879c-5.434 0-9.858 4.37-9.862 9.8-.001 1.762.463 3.484 1.347 5.015L1.81 22.113l4.837-1.259zM17.06 14.88c-.277-.139-1.643-.809-1.897-.901-.253-.093-.438-.139-.623.139-.184.278-.716.901-.877 1.087-.162.186-.323.208-.6.069-.278-.139-1.171-.43-2.23-1.374-.825-.733-1.38-1.64-1.543-1.918-.162-.278-.017-.428.122-.566.125-.124.277-.323.416-.486.139-.162.185-.278.277-.463.093-.185.046-.347-.023-.486-.069-.139-.623-1.505-.854-2.06-.225-.541-.453-.467-.623-.476-.162-.009-.347-.01-.531-.01-.184 0-.485.069-.739.347-.254.278-.97.949-.97 2.315 0 1.367.997 2.687 1.136 2.873.139.186 1.961 2.996 4.75 4.2.663.286 1.18.457 1.583.585.667.212 1.274.182 1.754.11.535-.08 1.643-.672 1.874-1.321.23-.649.23-1.205.162-1.321-.069-.116-.254-.185-.531-.324z" />
                  </svg>
                  {t('success.whatsapp')}
                </a>
                <a
                  href={getEmailPhotoLink()}
                  className="rounded border border-white/10 bg-white/5 py-3 text-center text-xs font-bold tracking-wider uppercase text-foreground hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {/* Email SVG */}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('success.email')}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-white/5 bg-white/[0.01] rounded-xl p-6 md:p-8">
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

            {/* Game Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('form.game')}
              </label>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGame('pokemon')}
                  className={`rounded border py-2.5 transition-all cursor-pointer ${
                    game === 'pokemon'
                      ? 'border-bronze bg-bronze/10 text-bronze'
                      : 'border-white/10 bg-transparent text-neutral-400 hover:text-foreground'
                  }`}
                >
                  Pokémon TCG
                </button>
                <button
                  type="button"
                  onClick={() => setGame('one_piece')}
                  className={`rounded border py-2.5 transition-all cursor-pointer ${
                    game === 'one_piece'
                      ? 'border-bronze bg-bronze/10 text-bronze'
                      : 'border-white/10 bg-transparent text-neutral-400 hover:text-foreground'
                  }`}
                >
                  One Piece TCG
                </button>
              </div>
            </div>

            {/* Card Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                  {t('form.cardDesc')}
                </label>
                <span className="text-[9px] text-neutral-600">e.g. Charizard ex 199/165</span>
              </div>
              <input
                type="text"
                required
                value={cardDesc}
                onChange={(e) => setCardDesc(e.target.value)}
                placeholder={t('form.cardDescHelp')}
                className="rounded border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-foreground focus:border-bronze focus:outline-none"
              />
            </div>

            {/* Photo Upload Box */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {tCommon('languages.it') === 'Italiano' ? 'Foto della Carta' : 'Card Photo'}
              </label>
              {foto ? (
                /* Selected File Preview */
                <div className="flex items-center gap-4 border border-white/10 bg-white/[0.02] p-4 rounded-lg">
                  <div className="relative h-16 w-12 rounded border border-white/10 bg-neutral-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto}
                      alt="Preview"
                      className="object-contain w-full h-full p-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-semibold truncate">{fileName}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {Math.round((fileSize || 0) / 1024)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rounded border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 cursor-pointer"
                  >
                    {tCommon('languages.it') === 'Italiano' ? 'Rimuovi' : 'Remove'}
                  </button>
                </div>
              ) : (
                /* Drag & Drop Upload Trigger */
                <div className="relative border border-dashed border-white/10 rounded-lg p-6 bg-white/[0.01] hover:border-bronze/40 hover:bg-[#121214] transition-all text-center flex flex-col items-center justify-center cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <svg className="h-6 w-6 text-neutral-500 mb-2 group-hover:text-bronze transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-neutral-400 group-hover:text-foreground transition-colors font-medium">
                    {tCommon('languages.it') === 'Italiano' ? 'Carica la foto della tua carta' : 'Upload your card photo'}
                  </span>
                  <span className="text-[10px] text-neutral-600 mt-1">
                    PNG, JPG, WEBP fino a 5MB
                  </span>
                </div>
              )}
            </div>

            {/* Message/Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                {t('form.message')}
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('form.messageHelp')}
                className="rounded border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-foreground focus:border-bronze focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-bronze py-3 text-xs font-bold tracking-widest uppercase text-[#0b0b0c] hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? tCommon('loading') : t('form.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
