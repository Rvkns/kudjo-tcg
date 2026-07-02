import { useTranslations } from 'next-intl';

export default function ChiSiamoPage() {
  const t = useTranslations('ChiSiamo');

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans py-16 md:py-24">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-4xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
            Kudjo Legacy
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        {/* Narrative Grid */}
        <div className="flex flex-col gap-10 border-t border-white/5 pt-10">
          {/* Section 1: The Story */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <h2 className="font-display text-2xl text-bronze font-light md:col-span-1">
              {t('storyTitle')}
            </h2>
            <div className="md:col-span-2 flex flex-col gap-4 text-sm text-neutral-400 leading-loose">
              <p>{t('storyP1')}</p>
              <p>{t('storyP2')}</p>
            </div>
          </div>

          {/* Section 2: Platform Vision */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 border-t border-white/5 pt-10">
            <h2 className="font-display text-2xl text-bronze font-light md:col-span-1">
              {t('visionTitle')}
            </h2>
            <div className="md:col-span-2 flex flex-col gap-4 text-sm text-neutral-400 leading-loose">
              <p>{t('visionP1')}</p>
            </div>
          </div>
        </div>

        {/* Visual Callout block */}
        <div className="mt-16 md:mt-24 rounded-xl border border-bronze/25 bg-bronze/5 p-8 text-center max-w-3xl mx-auto backdrop-blur-sm">
          <svg className="mx-auto h-8 w-8 text-bronze mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.553m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.553v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.553" />
          </svg>
          <p className="font-display text-lg text-foreground font-light mb-2">
            &ldquo;Every card tells a story, every transaction is a handshake.&rdquo;
          </p>
          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
            Kudjo Philosophy
          </span>
        </div>
      </div>
    </div>
  );
}
