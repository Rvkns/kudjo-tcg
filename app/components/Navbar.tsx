'use client';

import React, { useState, useEffect } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import KudjoLogo from './KudjoLogo';
import { getTotalPendingPacks } from '@/lib/data/kudjo-cards-db';

export default function Navbar() {
  const t = useTranslations('Navbar');
  const tCommon = useTranslations('Common');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingPacksCount, setPendingPacksCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      try {
        const count = await getTotalPendingPacks();
        setPendingPacksCount(count);
      } catch (err) {
        console.error(err);
      }
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 3000);
    return () => { 
      window.removeEventListener('storage', updateCount); 
      clearInterval(interval); 
    };
  }, []);

  const toggleLocale = () => {
    const nextLocale = currentLocale === 'it' ? 'en' : 'it';
    router.replace(pathname, { locale: nextLocale });
  };

  const navLinks = [
    { href: '/collezione', label: t('collezione') },
    { href: '/concorso',   label: t('concorso')   },
    { href: '/profilo',    label: t('profilo'), badge: pendingPacksCount > 0 ? pendingPacksCount : undefined },
    { href: '/vendici-carta', label: t('vendiciCarta') },
    { href: '/chi-siamo', label: t('chiSiamo') },
    { href: '/contatti',  label: t('contatti')  },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group select-none py-1">
          <KudjoLogo className="h-14 w-auto transition-transform duration-300 group-hover:scale-[1.02]" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-sans text-xs tracking-wider uppercase font-semibold text-neutral-400">
        {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-colors duration-300 hover:text-foreground flex items-center gap-1.5 ${isActive ? 'text-bronze' : ''}`}
              >
                {link.label}
                {'badge' in link && link.badge ? (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e11b22] text-white text-[8px] font-bold">
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Locale Toggler & Call to Action / WhatsApp link) */}
        <div className="hidden md:flex items-center gap-6">
          {/* Language Toggle */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 font-mono text-[11px] tracking-widest uppercase text-neutral-500 hover:text-foreground transition-colors border border-white/5 px-2.5 py-1 rounded bg-white/5 cursor-pointer"
          >
            <span className={currentLocale === 'it' ? 'text-bronze font-bold' : ''}>IT</span>
            <span className="text-neutral-700">|</span>
            <span className={currentLocale === 'en' ? 'text-bronze font-bold' : ''}>EN</span>
          </button>

          {/* Premium Call to Action */}
          <Link
            href="/collezione"
            className="rounded border border-bronze bg-bronze/10 px-5 py-2 text-[10px] font-bold tracking-widest uppercase text-bronze transition-all duration-300 hover:bg-bronze hover:text-[#0b0b0c]"
          >
            {tCommon('contactDealer')}
          </Link>
        </div>

        {/* Mobile Actions Container */}
        <div className="flex md:hidden items-center gap-4">
          {/* Language toggle for mobile */}
          <button
            onClick={toggleLocale}
            className="font-mono text-xs tracking-widest uppercase text-neutral-400 border border-white/5 px-2 py-0.5 rounded bg-white/5 cursor-pointer"
          >
            {currentLocale === 'it' ? 'EN' : 'IT'}
          </button>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground focus:outline-none cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/98 py-6 px-8 animate-fade-in">
          <nav className="flex flex-col gap-6 font-sans text-sm tracking-widest uppercase font-semibold text-neutral-400">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 transition-colors py-2 duration-300 hover:text-foreground ${isActive ? 'text-bronze' : ''}`}
                >
                  {link.label}
                  {'badge' in link && link.badge ? (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e11b22] text-white text-[8px] font-bold">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <Link
              href="/collezione"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 rounded border border-bronze bg-bronze/10 py-3 text-center text-xs font-bold tracking-widest uppercase text-bronze transition-all hover:bg-bronze hover:text-[#0b0b0c]"
            >
              {tCommon('contactDealer')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
