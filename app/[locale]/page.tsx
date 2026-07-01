import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="font-display text-5xl text-foreground">{t('title')}</h1>
      <p className="text-bronze text-lg">{t('subtitle')}</p>
      <p className="text-foreground/80">{t('intro')}</p>
    </main>
  );
}
