import { useTranslations } from 'next-intl';

export default function LegalPage() {
  const t = useTranslations('Legal');

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-foreground font-sans py-16 md:py-24">
      <div className="absolute top-0 right-1/4 h-[400px] w-[400px] rounded-full bg-bronze/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-bronze block mb-2">
            Compliance & Terms
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Legal content */}
        <div className="flex flex-col gap-10 text-xs text-neutral-400 leading-relaxed">
          {/* Section 1: Transaction Disclaimer (Critical) */}
          <div className="rounded-xl border border-bronze/25 bg-bronze/5 p-6 backdrop-blur-sm">
            <h2 className="font-display text-lg text-bronze font-light mb-3 uppercase tracking-wider">
              ⚠️ {t('disclaimerTitle')}
            </h2>
            <div className="flex flex-col gap-3 text-neutral-300">
              <p>{t('disclaimerP1')}</p>
              <p>{t('disclaimerP2')}</p>
            </div>
          </div>

          {/* Section 2: Privacy Policy */}
          <div className="flex flex-col gap-4 border-t border-white/5 pt-8">
            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
              {t('privacyTitle')}
            </h2>
            <p className="italic text-neutral-300">{t('privacyIntro')}</p>
            
            <div className="flex flex-col gap-5 pl-2">
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('controllerTitle')}</h3>
                <p>{t('controllerText')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('dataTypeTitle')}</h3>
                <ul className="list-disc pl-4 flex flex-col gap-1 mt-1">
                  <li>{t('dataTypeText1')}</li>
                  <li>{t('dataTypeText2')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('purposeTitle')}</h3>
                <ul className="list-disc pl-4 flex flex-col gap-1 mt-1">
                  <li>{t('purposeText1')}</li>
                  <li>{t('purposeText2')}</li>
                  <li>{t('purposeText3')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('recipientsTitle')}</h3>
                <p>{t('recipientsText')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('retentionTitle')}</h3>
                <p>{t('retentionText')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('rightsTitle')}</h3>
                <p>{t('rightsText')}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Cookie Policy */}
          <div className="flex flex-col gap-4 border-t border-white/5 pt-8">
            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
              {t('cookieTitle')}
            </h2>
            <p className="italic text-neutral-300">{t('cookieIntro')}</p>

            <div className="flex flex-col gap-5 pl-2">
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('cookieTechnicalTitle')}</h3>
                <p>{t('cookieTechnicalText')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('cookieDetailsTitle')}</h3>
                <ul className="list-disc pl-4 flex flex-col gap-2 mt-1">
                  <li>{t('cookieDetailsText1')}</li>
                  <li>{t('cookieDetailsText2')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 mb-1">{t('cookieManageTitle')}</h3>
                <p>{t('cookieManageText')}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Intellectual Property */}
          <div className="flex flex-col gap-3 border-t border-white/5 pt-8">
            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
              Intellectual Property Disclaimer
            </h2>
            <p>
              Pokémon TCG is a trademark of Nintendo, Creatures Inc., and Game Freak.
              One Piece TCG is a trademark of Eiichiro Oda / Shueisha and Bandai.
              Kudjo is an independent dealer and is not affiliated with, endorsed by,
              or associated with Nintendo, Creatures, Game Freak, Shueisha, or Bandai.
              All product images, trademarks, and copyrights displayed in the catalog
              belong to their respective owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
