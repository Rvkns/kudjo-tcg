import { getPopulatedItems } from '@/lib/data/mock-db';
import { maskPublicPrices } from '@/lib/data/price-mask';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import HoloCard from '@/app/components/HoloCard';

export default function HomePage() {
  const t = useTranslations('Home');
  const tCommon = useTranslations('Common');
  
  // Custom selection of featured items to show on the homepage (including the new ones)
  const featuredIds = [
    'item_p_umbreon_psa10',
    'item_op_ace_manga_psa10',
    'item_p_charizard_psa10',
    'item_p_pikachu_psa10',
    'item_p_espeon_psa9',
    'item_p_sylveon_psa9',
  ];

  // Masked: this is a Server Component, so any unmasked price above
  // SOGLIA_PREZZO_PUBBLICO would be serialized into the page's RSC payload even
  // though the UI displays "Su richiesta" — see lib/data/price-mask.ts.
  const allItems = maskPublicPrices(getPopulatedItems());
  const items = featuredIds
    .map(id => allItems.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => !!item);

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* Background Decorative Gradient elements */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 h-[600px] w-[600px] rounded-full bg-bronze/5 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-6 pt-12 pb-24 md:px-10 md:pb-32">
        <div className="max-w-3xl flex flex-col gap-6 md:gap-8">
          <div className="inline-flex items-center gap-2 max-w-max rounded-full border border-bronze/35 bg-bronze/5 px-4 py-1.5 text-[9px] font-bold tracking-[0.25em] uppercase text-bronze backdrop-blur-sm">
            {tCommon('tagline')}
          </div>

          <h1 className="font-display text-4xl leading-[1.1] text-foreground md:text-7xl font-light">
            {t('title')}{' '}
            <span className="text-bronze font-normal block mt-2 text-2xl md:text-5xl tracking-wide font-sans">
              {t('subtitle')}
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-neutral-400 md:text-base md:leading-loose">
            {t('heroDesc')}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <Link
              href="/collezione"
              className="rounded bg-bronze px-8 py-4 text-center text-xs font-bold tracking-widest uppercase text-[#0b0b0c] hover:bg-opacity-95 transition-all shadow-[0_4px_20px_rgba(156,122,82,0.25)] cursor-pointer"
            >
              {t('heroCTA')}
            </Link>
            <Link
              href="/chi-siamo"
              className="rounded border border-white/10 hover:border-bronze/40 hover:bg-white/5 px-8 py-4 text-center text-xs font-bold tracking-widest uppercase text-foreground transition-all cursor-pointer"
            >
              {tCommon('readMore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="border-t border-white/5 bg-white/[0.01] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
                {t('featuredTitle')}
              </span>
              <h2 className="font-display text-3xl md:text-4xl text-foreground font-light">
                {t('featuredSubtitle')}
              </h2>
            </div>
            <Link
              href="/collezione"
              className="text-xs font-bold tracking-widest uppercase text-bronze hover:text-foreground transition-colors group flex items-center gap-1.5 cursor-pointer"
            >
              {tCommon('languages.it') === 'Italiano' ? 'Vedi tutti i lotti' : 'View all lots'}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Interactive Cards Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((populatedItem) => (
              <Link
                key={populatedItem.id}
                href={`/collezione/${populatedItem.id}`}
                className="block"
              >
                <HoloCard populatedItem={populatedItem} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The Kudjo Standard / Value Props */}
      <section className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
              {t('standards.title')}
            </span>
            <h2 className="font-display text-3xl md:text-5xl text-foreground font-light">
              {t('standards.subtitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {/* Authenticity card */}
            <div className="flex flex-col gap-4 border border-white/5 bg-white/[0.01] p-8 rounded-xl transition-all duration-300 hover:border-bronze/35">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bronze/10 text-bronze">
                {/* Shield Check SVG */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-foreground mt-2 font-medium">
                {t('standards.authTitle')}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-500">
                {t('standards.authDesc')}
              </p>
            </div>

            {/* Real photography card */}
            <div className="flex flex-col gap-4 border border-white/5 bg-white/[0.01] p-8 rounded-xl transition-all duration-300 hover:border-bronze/35">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bronze/10 text-bronze">
                {/* Camera SVG */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-foreground mt-2 font-medium">
                {t('standards.photoTitle')}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-500">
                {t('standards.photoDesc')}
              </p>
            </div>

            {/* P2P private negotiation card */}
            <div className="flex flex-col gap-4 border border-white/5 bg-white/[0.01] p-8 rounded-xl transition-all duration-300 hover:border-bronze/35">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bronze/10 text-bronze">
                {/* User Group / Handshake SVG */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-foreground mt-2 font-medium">
                {t('standards.p2pTitle')}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-500">
                {t('standards.p2pDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
