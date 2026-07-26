'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCart, CartItem } from '@/app/context/CartContext';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

export default function CartDrawer() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();
  const isIt = locale === 'it';

  const {
    items,
    isCartOpen,
    closeCart,
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

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
      console.error('Cart checkout error:', err);
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
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#121214] border-l border-white/10 shadow-2xl text-foreground font-sans animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bronze/10 border border-bronze/30 text-bronze">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-medium text-white">{t('title')}</h2>
              <p className="text-[11px] text-neutral-400">
                {t('itemCount', { n: totalItems })}
              </p>
            </div>
          </div>

          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Chiudi carrello"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-600 mb-6">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-white mb-2">{t('empty')}</h3>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-8">
              {t('emptyDesc')}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link
                href="/concorso"
                onClick={closeCart}
                className="w-full rounded bg-bronze py-3 text-center text-xs font-bold uppercase tracking-widest text-[#0b0b0c] hover:bg-opacity-90 transition-all cursor-pointer shadow-md"
              >
                {t('explorePacks')}
              </Link>
              <Link
                href="/collezione"
                onClick={closeCart}
                className="w-full rounded border border-white/10 bg-white/5 py-3 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                {t('exploreCollection')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
              {items.map((item) => {
                const badge = getItemBadge(item);
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-white/15"
                  >
                    {/* Thumbnail */}
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

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`inline-block rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${badge.color}`}>
                            {badge.label}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-neutral-500 hover:text-red-400 text-xs transition-colors cursor-pointer p-1"
                            title="Rimuovi"
                          >
                            🗑️
                          </button>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        {item.tickets && item.tickets > 0 ? (
                          <div className="text-[10px] text-bronze font-semibold mt-0.5">
                            🎟️ {item.tickets * item.quantity} {isIt ? 'ticket omaggio' : 'free tickets'}
                          </div>
                        ) : item.details?.subtitle ? (
                          <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                            {item.details.subtitle}
                          </div>
                        ) : null}
                      </div>

                      {/* Quantity & Pricing */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center border border-white/10 bg-[#0b0b0c] rounded-md px-1 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 flex items-center justify-center text-xs text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 flex items-center justify-center text-xs text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-semibold text-white">
                            €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[9px] text-neutral-500 font-mono">
                              €{item.price.toFixed(2)} {t('unitPrice')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary & Checkout */}
            <div className="border-t border-white/10 bg-[#0b0b0c] p-6 space-y-4">
              {/* Clear cart */}
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={clearCart}
                  className="text-[10px] uppercase font-semibold text-neutral-500 hover:text-red-400 tracking-wider transition-colors cursor-pointer"
                >
                  {t('clearCart')}
                </button>
                {totalTickets > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#e11b22]/15 border border-[#e11b22]/40 text-[#ffb7b7] px-2.5 py-1 rounded text-[11px] font-bold">
                    <span>🎟️</span>
                    <span>{t('freeTicketsEarned', { n: totalTickets })}</span>
                  </div>
                )}
              </div>

              {/* Total Price */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  {t('total')}
                </span>
                <span className="font-mono text-2xl font-bold text-white tracking-tight">
                  €{totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {user ? (
                  <button
                    onClick={handleCheckout}
                    disabled={loadingCheckout}
                    className="w-full bg-[#e11b22] hover:bg-red-700 disabled:opacity-50 text-white py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(225,27,34,0.2)] font-sans"
                  >
                    <span>{loadingCheckout ? t('processing') : t('checkoutStripe')}</span>
                    <span className="inline-block">→</span>
                  </button>
                ) : (
                  <div className="rounded-lg border border-bronze/30 bg-bronze/5 p-3.5 text-center space-y-2.5">
                    <p className="text-[11px] text-neutral-300 leading-snug">
                      {t('loginRequired')}
                    </p>
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full bg-white hover:bg-neutral-100 text-[#0b0b0c] py-2.5 px-4 rounded-md text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md font-sans"
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

                <Link
                  href="/carrello"
                  onClick={closeCart}
                  className="w-full flex items-center justify-center py-2.5 rounded border border-white/10 text-[10px] font-bold tracking-widest uppercase text-neutral-300 hover:text-white hover:bg-white/5 transition-all text-center"
                >
                  {t('checkoutPage')} →
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
