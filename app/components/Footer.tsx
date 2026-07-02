'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import KudjoLogo from './KudjoLogo';

export default function Footer() {
  const t = useTranslations('Footer');
  const tCommon = useTranslations('Common');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Mock subscription
    setSubmitted(true);
    setEmail('');
    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  return (
    <footer className="w-full border-t border-white/5 bg-background text-neutral-400 font-sans">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center select-none max-w-max py-1">
              <KudjoLogo className="h-11 w-auto transition-transform duration-300 hover:scale-[1.02]" />
            </Link>
            <p className="max-w-md text-xs leading-relaxed text-neutral-500">
              {t('desc')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold tracking-widest uppercase text-foreground">
              {t('linksTitle')}
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li>
                <Link href="/collezione" className="hover:text-foreground transition-colors">
                  {tCommon('languages.it') === 'Italiano' ? 'La Collezione' : 'The Collection'}
                </Link>
              </li>
              <li>
                <Link href="/vendici-carta" className="hover:text-foreground transition-colors">
                  {tCommon('languages.it') === 'Italiano' ? 'Proponi una Carta' : 'Submit a Card'}
                </Link>
              </li>
              <li>
                <Link href="/chi-siamo" className="hover:text-foreground transition-colors">
                  {tCommon('languages.it') === 'Italiano' ? 'La Nostra Storia' : 'Our Story'}
                </Link>
              </li>
              <li>
                <Link href="/contatti" className="hover:text-foreground transition-colors">
                  {tCommon('languages.it') === 'Italiano' ? 'Contattaci' : 'Get in Touch'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / Stay Updated */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold tracking-widest uppercase text-foreground">
              {t('newsletter')}
            </h4>
            {submitted ? (
              <p className="text-xs text-bronze animate-fade-in font-medium">
                {t('newsletterSuccess')}
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsletterPlaceholder')}
                  required
                  className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground placeholder-neutral-600 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
                />
                <button
                  type="submit"
                  className="rounded bg-bronze px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-[#0b0b0c] hover:bg-opacity-90 transition-all cursor-pointer"
                >
                  {t('newsletterBtn')}
                </button>
              </form>
            )}

            {/* Social Links Icons */}
            <div className="mt-2 flex gap-4 text-neutral-500">
              <a href="#" className="hover:text-foreground transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="#" className="hover:text-foreground transition-colors" aria-label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.107C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.556a3.003 3.003 0 00-2.11 2.107C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 002.11 2.107C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.556a3.003 3.003 0 002.11-2.107C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Transaction Disclaimer (Critical Section) */}
        <div className="mt-12 border-t border-white/5 pt-8 text-center md:text-left">
          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-5 text-xs text-neutral-500 leading-relaxed max-w-4xl mx-auto md:mx-0">
            <span className="font-bold text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">
              {tCommon('languages.it') === 'Italiano' ? 'Disclaimer Importante' : 'Important Disclaimer'}
            </span>
            {tCommon('disclaimer')}
          </div>
        </div>

        {/* Footer Bottom (Copyright and Legal Pages Link) */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-[11px] text-neutral-600 md:flex-row">
          <div>
            &copy; {new Date().getFullYear()} Kudjo. {t('rights')}
          </div>
          <div className="flex gap-6">
            <Link href="/legal" className="hover:text-neutral-400 transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/legal" className="hover:text-neutral-400 transition-colors">
              {t('terms')}
            </Link>
            <Link href="/legal" className="hover:text-neutral-400 transition-colors">
              {t('disclaimer')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
