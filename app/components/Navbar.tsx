'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import KudjoLogo from './KudjoLogo';
import { getTotalPendingPacks } from '@/lib/data/kudjo-cards-db';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import Image from 'next/image';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

export default function Navbar() {
  const t = useTranslations('Navbar');
  const tCommon = useTranslations('Common');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingPacksCount, setPendingPacksCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Load user session
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLogout = async () => {
    setAvatarDropdownOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/');
  };

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const navLinks = [
    { href: '/collezione', label: t('collezione') },
    { href: '/concorso',   label: t('concorso')   },
    { href: '/profilo',    label: t('profilo'), badge: pendingPacksCount > 0 ? pendingPacksCount : undefined },
    { href: '/vendici-carta', label: t('vendiciCarta') },
    { href: '/chi-siamo', label: t('chiSiamo') },
    { href: '/contatti',  label: t('contatti')  },
  ];

  // Derive initials and avatar URL from Google user
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name ?? user?.email ?? '') as string;
  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
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

          {/* User Avatar / Profile Button */}
          {user ? (
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-full border-2 border-bronze/40 hover:border-bronze/80 transition-all duration-200 overflow-hidden bg-neutral-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-bronze/50"
                aria-label="Profilo utente"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-bold text-bronze">{initials}</span>
                )}
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0b0b0c]" title="Admin" />
                )}
              </button>

              {/* Dropdown */}
              {avatarDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/8 bg-[#121214] shadow-2xl py-2 z-50 animate-fade-in">
                  {/* User info */}
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/profilo"
                    onClick={() => setAvatarDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>👤</span> Il mio profilo
                    {pendingPacksCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e11b22] text-white text-[8px] font-bold">
                        {pendingPacksCount}
                      </span>
                    )}
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setAvatarDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 transition-colors font-semibold"
                    >
                      <span>🔐</span> Admin Panel
                    </Link>
                  )}

                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
                    >
                      <span>↗</span> Esci
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/profilo"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:border-bronze/40 hover:bg-bronze/5 transition-all duration-200"
              aria-label="Accedi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          )}
        </div>

        {/* Mobile Actions Container */}
        <div className="flex md:hidden items-center gap-3">
          {/* Language toggle for mobile */}
          <button
            onClick={toggleLocale}
            className="font-mono text-xs tracking-widest uppercase text-neutral-400 border border-white/5 px-2 py-0.5 rounded bg-white/5 cursor-pointer"
          >
            {currentLocale === 'it' ? 'EN' : 'IT'}
          </button>

          {/* Mobile avatar */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-bronze/40 overflow-hidden bg-neutral-800 cursor-pointer"
              aria-label="Profilo"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-[10px] font-bold text-bronze">{initials}</span>
              )}
              {isAdmin && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0b0b0c]" />
              )}
            </button>
          )}

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

            {/* Admin link in mobile menu */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-amber-400 font-bold tracking-widest uppercase text-sm"
              >
                🔐 Admin Panel
              </Link>
            )}

            <Link
              href="/collezione"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 rounded border border-bronze bg-bronze/10 py-3 text-center text-xs font-bold tracking-widest uppercase text-bronze transition-all hover:bg-bronze hover:text-[#0b0b0c]"
            >
              {tCommon('contactDealer')}
            </Link>

            {/* Mobile logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="text-left text-xs text-neutral-500 hover:text-red-400 transition-colors tracking-widest uppercase cursor-pointer"
              >
                ↗ Esci
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
