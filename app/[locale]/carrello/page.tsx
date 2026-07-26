'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCart, CartItem } from '@/app/context/CartContext';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

export default function CartPage() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const isIt = locale === 'it';

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
    totalTickets,
  } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert(t('loginRequired'));
        return;
      }

      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: items,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(t('checkoutError', { error: data.error || 'Unknown error' }));
      }
    } catch (err) {
      console.error('Cart page checkout error:', err);
      alert(t('checkoutError', { error: 'Server error' }));
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const getItemBadge = (item: CartItem) => {
    switch (item.type) {
      case 'pack':
        return { label: t('digitalPacksBadge'), color: 'bg-bronze/10 text-bronze border-bronze/30' };
      case 'card':
        return { label: t('cardBadge'), color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'product':
      default:
        return { label: t('accessoryBadge'), color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans py-12 md:py-20">
      <div className="absolute top-0 right-1/3 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
              Kudjo Shopping Cart
            </span>
            <h1 className="font-display text-3xl md:text-5xl text-white font-light">
              {t('title')}
            </h1>
          </div>

          <div className="text-xs text-neutral-400 font-mono">
            {t('itemCount', { n: totalItems })}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-white/5 bg-[#121214] rounded-2xl py-24 px-6 text-center max-w-2xl mx-auto shadow-2xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-500 mb-6">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-white mb-3">{t('empty')}</h2>
            <p className="text-sm text-neutral-400 max-w-md leading-relaxed mb-8">
              {t('emptyDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Link
                href="/concorso"
                className="flex-1 rounded bg-bronze py-4 text-center text-xs font-bold uppercase tracking-widest text-[#0b0b0c] hover:bg-opacity-90 transition-all shadow-lg"
              >
                {t('explorePacks')}
              </Link>
              <Link
                href="/collezione"
                className="flex-1 rounded border border-white/10 bg-white/5 py-4 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                {t('exploreCollection')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
            {/* Left Items Table/List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-2 pb-2 text-xs uppercase tracking-wider text-neutral-400 font-semibold border-b border-white/5">
                <span>{isIt ? 'Articoli selezionati' : 'Selected Items'}</span>
                <button
                  onClick={clearCart}
                  className="text-[10px] text-neutral-500 hover:text-red-400 transition-colors uppercase cursor-pointer"
                >
                  {t('clearCart')}
                </button>
              </div>

              {items.map((item) => {
                const badge = getItemBadge(item);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#121214] p-5 shadow-xl transition-all hover:border-white/15"
                  >
                    {/* Item Info */}
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c] p-1 flex items-center justify-center">
                        {item.image && item.image.length > 3 ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <span className="text-xs font-bold text-bronze">{item.image || 'K'}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className={`inline-block rounded border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${badge.color}`}>
                          {badge.label}
                        </span>
                        <h3 className="font-display text-base font-medium text-white">
                          {item.name}
                        </h3>
                        {item.tickets && item.tickets > 0 ? (
                          <div className="text-xs text-bronze font-semibold">
                            🎟️ {item.tickets * item.quantity} {isIt ? 'ticket omaggio concorso' : 'free contest tickets'}
                          </div>
                        ) : item.details?.subtitle ? (
                          <div className="text-xs text-neutral-400">
                            {item.details.subtitle}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Quantity & Price Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-white/10 bg-[#0b0b0c] rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center text-sm text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center text-sm text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right min-w-[80px]">
                        <span className="font-mono text-base font-bold text-white">
                          €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-neutral-500 font-mono">
                            €{item.price.toFixed(2)} {t('unitPrice')}
                          </span>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-2 cursor-pointer text-sm"
                        title="Rimuovi"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Continue Shopping */}
              <div className="pt-4 flex items-center gap-4">
                <Link
                  href="/concorso"
                  className="text-xs text-neutral-400 hover:text-bronze transition-colors flex items-center gap-1 uppercase tracking-wider font-semibold"
                >
                  ← {isIt ? 'Continua gli acquisti nel Concorso' : 'Continue shopping in Contest'}
                </Link>
              </div>
            </div>

            {/* Right Summary Card */}
            <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#121214] p-6 shadow-2xl space-y-6">
              <h2 className="font-display text-xl text-white font-medium border-b border-white/5 pb-4">
                {isIt ? 'Riepilogo Ordine' : 'Order Summary'}
              </h2>

              <div className="space-y-3 text-xs text-neutral-300 font-sans">
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('subtotal')}</span>
                  <span className="font-mono font-semibold text-white">
                    €{totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {totalTickets > 0 && (
                  <div className="flex justify-between items-center bg-bronze/10 border border-bronze/30 p-3 rounded-lg text-bronze">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>🎟️</span> Ticket Omaggio Concorso
                    </span>
                    <span className="font-mono font-bold text-sm">
                      +{totalTickets}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-4 flex items-baseline justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-white">
                  {t('total')}
                </span>
                <span className="font-mono text-3xl font-bold text-white tracking-tight">
                  €{totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Checkout actions */}
              <div className="space-y-3 pt-2">
                {user ? (
                  <button
                    onClick={handleCheckout}
                    disabled={loadingCheckout}
                    className="w-full bg-[#e11b22] hover:bg-red-700 disabled:opacity-50 text-white py-4 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(225,27,34,0.2)] font-sans"
                  >
                    <span>{loadingCheckout ? t('processing') : t('checkoutStripe')}</span>
                    <span className="inline-block">→</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-bronze/30 bg-bronze/5 p-5 text-center space-y-3">
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {t('loginRequired')}
                    </p>
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full bg-white hover:bg-neutral-100 text-[#0b0b0c] py-3 px-5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md font-sans"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>{t('loginBtn')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
