'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ContattiPage() {
  const t = useTranslations('Contatti');
  const tCommon = useTranslations('Common');

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
          messaggio: message,
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

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans py-16 md:py-24">
      <div className="absolute top-0 right-10 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
            Get In Touch
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 border-t border-white/5 pt-12">
          {/* Left Column: Direct Channels */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <h2 className="font-display text-2xl text-foreground font-light mb-3">
                {t('infoTitle')}
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                {t('infoDesc')}
              </p>
            </div>

            {/* Direct buttons */}
            <div className="flex flex-col gap-4">
              {/* WhatsApp direct link */}
              <a
                href="https://wa.me/393330000000"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-emerald-500/25 bg-emerald-950/15 p-4 flex items-center justify-between hover:bg-emerald-950/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-emerald-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.774 9.774 0 00-6.978-2.879c-5.434 0-9.858 4.37-9.862 9.8-.001 1.762.463 3.484 1.347 5.015L1.81 22.113l4.837-1.259zM17.06 14.88c-.277-.139-1.643-.809-1.897-.901-.253-.093-.438-.139-.623.139-.184.278-.716.901-.877 1.087-.162.186-.323.208-.6.069-.278-.139-1.171-.43-2.23-1.374-.825-.733-1.38-1.64-1.543-1.918-.162-.278-.017-.428.122-.566.125-.124.277-.323.416-.486.139-.162.185-.278.277-.463.093-.185.046-.347-.023-.486-.069-.139-.623-1.505-.854-2.06-.225-.541-.453-.467-.623-.476-.162-.009-.347-.01-.531-.01-.184 0-.485.069-.739.347-.254.278-.97.949-.97 2.315 0 1.367.997 2.687 1.136 2.873.139.186 1.961 2.996 4.75 4.2.663.286 1.18.457 1.583.585.667.212 1.274.182 1.754.11.535-.08 1.643-.672 1.874-1.321.23-.649.23-1.205.162-1.321-.069-.116-.254-.185-.531-.324z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-emerald-400 uppercase tracking-widest">WhatsApp</span>
                    <span className="text-[10px] text-neutral-500 font-mono">+39 333 0000000</span>
                  </div>
                </div>
                <span className="text-neutral-600 group-hover:text-emerald-400 transition-colors">→</span>
              </a>

              {/* Telegram direct link */}
              <a
                href="https://t.me/kudjoshop"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-sky-500/25 bg-sky-950/15 p-4 flex items-center justify-between hover:bg-sky-950/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sky-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-sky-400 uppercase tracking-widest">Telegram</span>
                    <span className="text-[10px] text-neutral-500 font-mono">@kudjoshop</span>
                  </div>
                </div>
                <span className="text-neutral-600 group-hover:text-sky-400 transition-colors">→</span>
              </a>

              {/* Email direct link */}
              <a
                href="mailto:kudjotcg@gmail.com"
                className="rounded-lg border border-neutral-500/25 bg-neutral-950/20 p-4 flex items-center justify-between hover:bg-neutral-950/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-neutral-400 group-hover:text-bronze transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-neutral-300 uppercase tracking-widest group-hover:text-bronze transition-colors">Email</span>
                    <span className="text-[10px] text-neutral-500 font-mono">kudjotcg@gmail.com</span>
                  </div>
                </div>
                <span className="text-neutral-600 group-hover:text-foreground transition-colors">→</span>
              </a>
            </div>
          </div>

          {/* Right Column: General Contact Form */}
          <div className="lg:col-span-7 flex flex-col gap-6 border-t lg:border-t-0 lg:border-l border-white/5 pt-12 lg:pt-0 lg:pl-12">
            <div>
              <h2 className="font-display text-2xl text-foreground font-light mb-3">
                {t('formTitle')}
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                {t('formDesc')}
              </p>
            </div>

            {submitSuccess ? (
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-8 text-center animate-fade-in">
                <svg className="mx-auto h-10 w-10 text-emerald-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-display text-xl text-foreground font-light mb-2">
                  {t('success')}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {tCommon('disclaimer')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-white/5 bg-white/[0.01] rounded-xl p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                      {tCommon('languages.it') === 'Italiano' ? 'Nome' : 'Name'}
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
                      {tCommon('languages.it') === 'Italiano' ? 'Email o Telefono' : 'Email or Phone'}
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
                    {tCommon('languages.it') === 'Italiano' ? 'Messaggio' : 'Message'}
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded border border-white/10 bg-[#0b0b0c] px-3 py-2 text-xs text-foreground focus:border-bronze focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-bronze py-3 text-xs font-bold tracking-widest uppercase text-[#0b0b0c] hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer mt-2"
                >
                  {isSubmitting ? tCommon('loading') : tCommon('submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
