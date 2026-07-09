'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('kudjo-cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('kudjo-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 transition-all duration-500">
      <div className="mx-auto max-w-5xl rounded-xl border border-bronze/20 bg-[#0b0b0c]/95 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8),0_4px_24px_rgba(156,122,82,0.1)] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
            {t('text')}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 justify-end">
          <Link
            href="/legal"
            className="text-xs font-semibold text-neutral-400 hover:text-bronze transition-colors"
          >
            {t('policy')}
          </Link>
          <button
            onClick={handleAccept}
            className="rounded bg-bronze px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0b0b0c] hover:bg-opacity-90 transition-all cursor-pointer shadow-[0_2px_10px_rgba(156,122,82,0.2)]"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
