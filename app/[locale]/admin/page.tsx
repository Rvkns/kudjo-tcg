'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

export default function AdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() ?? '';
      setUserEmail(email);
      if (!email || !ADMIN_EMAILS.includes(email)) {
        router.replace('/');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };
    checkAdmin();
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Verifica accesso admin...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const adminCards = [
    {
      href: '/admin/analytics',
      icon: '📈',
      title: 'Analytics & KPI Dashboard',
      description: 'Panoramica e dettaglio di fatturato, acquisti per orario, pull rate carte, utenti e conversioni.',
      color: 'from-cyan-500/10 to-blue-900/5 border-cyan-500/20 hover:border-cyan-500/40',
      badge: 'Panoramica Generale',
    },
    {
      href: '/admin/carte',
      icon: '🃏',
      title: 'Gestione Carte & Pacchetti',
      description: 'Aggiungi nuove carte TCG, modifica descrizioni/grafica ed aggiorna i prezzi dei pacchetti.',
      color: 'from-cyan-500/10 to-emerald-900/5 border-cyan-500/20 hover:border-cyan-500/40',
      badge: 'Sezione attiva',
    },
    {
      href: '/admin/concorsi',
      icon: '🏆',
      title: 'Gestione Concorsi',
      description: 'Crea, attiva, concludi concorsi. Configura reset automatici e visualizza statistiche.',
      color: 'from-amber-500/10 to-amber-900/5 border-amber-500/20 hover:border-amber-500/40',
      badge: 'Sezione principale',
    },
    {
      href: '/admin/sondaggi',
      icon: '📊',
      title: 'Gestione Sondaggi',
      description: 'Crea, pubblica e archivia sondaggi per raccogliere feedback dagli utenti. Visualizza le risposte.',
      color: 'from-purple-500/10 to-purple-900/5 border-purple-500/20 hover:border-purple-500/40',
      badge: 'Sezione attiva',
    },
    {
      href: '/admin/collection-sets',
      icon: '🎴',
      title: 'Collection Sets',
      description: 'Configura le collezioni da completare per sbloccare sconti agli utenti.',
      color: 'from-blue-500/10 to-blue-900/5 border-blue-500/20 hover:border-blue-500/40',
      badge: 'Sezione attiva',
    },
    {
      href: '/admin/riffa',
      icon: '🎫',
      title: 'Ticket & Riffa',
      description: 'Visualizza la distribuzione dei ticket e gestisci il sorteggio finale.',
      color: 'from-red-500/10 to-red-900/5 border-red-500/20 hover:border-red-500/40',
      badge: 'Sezione attiva',
    },
    {
      href: '/admin/sconti',
      icon: '💸',
      title: 'Sconti Utenti',
      description: 'Visualizza e gestisci gli sconti permanenti degli utenti.',
      color: 'from-emerald-500/10 to-emerald-900/5 border-emerald-500/20 hover:border-emerald-500/40',
      badge: 'Sezione attiva',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors text-sm">
              ← Sito
            </Link>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-semibold text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {userEmail}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
            🔐 Accesso Amministratore
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-white mb-2">
            Kudjo <span className="text-amber-400 font-semibold">Admin</span>
          </h1>
          <p className="text-neutral-400 text-sm">
            Pannello di controllo per la gestione dei concorsi TCG digitali.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative flex flex-col gap-4 p-6 rounded-xl border bg-gradient-to-br ${card.color} transition-all duration-300 ${card.href === '#' ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:scale-[1.01]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{card.icon}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 border border-neutral-700 px-2 py-0.5 rounded-full">
                  {card.badge}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">{card.title}</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">{card.description}</p>
              </div>
              {card.href !== '#' && (
                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  Apri sezione <span>→</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
