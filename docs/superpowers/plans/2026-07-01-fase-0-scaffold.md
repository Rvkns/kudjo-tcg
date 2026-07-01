# Kudjo — Fase 0: Scaffold Tecnico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the technical base for the Kudjo site — Next.js 15 project, design tokens (palette + fonts), IT/EN i18n routing with a placeholder home, and a typed Zod schema for the full card taxonomy — then deploy it publicly on Vercel.

**Architecture:** Single Next.js 15 App Router project. Locale-based routing (`app/[locale]`) via `next-intl` provides the IT/EN skeleton. Design tokens live in `app/globals.css` (Tailwind v4 `@theme` block), consumed as Tailwind utility classes — never hardcoded per-component. The card taxonomy (spec section 4) is implemented as standalone Zod schema modules under `lib/schema/`, each independently unit-tested with Vitest, with a shared `Gioco` enum to avoid type duplication across modules.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, next-intl, Zod, Vitest, npm.

## Global Constraints

- Package manager: npm only (per project spec, no unnecessary dependencies).
- Locales: `it` (default), `en` — exactly these two, via next-intl.
- Palette: nero/antracite (`#0b0b0c` background, `#f2ede4` foreground) + one bronze accent (`#9c7a52` / `#6b4f36` dark). No other primary/bright colors.
- Fonts: **Fraunces** (display/headings) + **Inter** (body/UI), loaded via `next/font/google`.
- `SOGLIA_PREZZO_PUBBLICO = 1000` (single source of truth in `lib/config.ts`) — not used by UI yet in this phase, but defined now as it's a domain constant.
- `tipo_carta` and `rarita` are free strings validated against per-game lists in `lib/schema/taxonomy.ts` — never hardcoded `z.enum` in the schema itself.
- Out of scope for this phase: shadcn/ui, holo-tilt effect, mock catalog data, real content pages, functional contact forms.

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: entire Next.js scaffold at project root (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/*`, `.gitignore`)
- Test: none (verified via build + dev server response)

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run lint` scripts; a working Next.js project root.

- [ ] **Step 1: Scaffold into a temp directory**

The project directory already contains `CLAUDE.md`, `docs/`, and `.git/`, so `create-next-app` must not run directly in it (it refuses non-empty directories). Scaffold into a temp subdirectory instead:

```bash
cd "H:/Progetti AI/Kudjo"
npx --yes create-next-app@latest kudjo-scaffold-tmp --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

Expected: command exits 0, `kudjo-scaffold-tmp/` contains `package.json`, `app/`, `node_modules/`.

- [ ] **Step 2: Move scaffolded files into the project root**

```bash
cd "H:/Progetti AI/Kudjo"
rm -rf kudjo-scaffold-tmp/.git
shopt -s dotglob
mv kudjo-scaffold-tmp/* .
shopt -u dotglob
rmdir kudjo-scaffold-tmp
```

Expected: `ls "H:/Progetti AI/Kudjo"` shows `package.json`, `app/`, `node_modules/`, `CLAUDE.md`, `docs/`, `.git/` all side by side.

- [ ] **Step 3: Verify the project builds**

```bash
npm run build
```

Expected: output ends with "Compiled successfully" and exit code 0.

- [ ] **Step 4: Verify the dev server serves the default page**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000 | grep -o "<title>[^<]*</title>"
kill %1
```

Expected: prints a `<title>` tag (default Next.js starter title), confirming the server responds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js 15 project (TypeScript, Tailwind, ESLint)"
```

---

### Task 2: i18n routing skeleton (next-intl)

**Files:**
- Create: `i18n/routing.ts`, `i18n/navigation.ts`, `i18n/request.ts`
- Create: `middleware.ts`
- Create: `messages/it.json`, `messages/en.json`
- Create: `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`
- Modify: `next.config.ts`
- Delete: `app/page.tsx`, `app/layout.tsx` (replaced by the `[locale]` versions; `app/globals.css` stays)

**Interfaces:**
- Consumes: Next.js project from Task 1.
- Produces: `routing` object (`i18n/routing.ts`, locales `['it', 'en']`, default `'it'`); message keys `Home.title`, `Home.subtitle`, `Home.intro` in both `messages/it.json` and `messages/en.json`.

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Create the routing config**

Create `i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['it', 'en'],
  defaultLocale: 'it',
});
```

- [ ] **Step 3: Create the navigation helpers**

Create `i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: Create the request config**

Create `i18n/request.ts`:

```ts
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: Create the middleware**

Create `middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 6: Wrap next.config.ts with the next-intl plugin**

Replace the contents of `next.config.ts`:

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Create the message files**

Create `messages/it.json`:

```json
{
  "Home": {
    "title": "Kudjo",
    "subtitle": "Una collezione curata di carte Pokémon e One Piece TCG",
    "intro": "Vetrina digitale per collezionisti. Ogni pezzo selezionato, fotografato e verificato con cura."
  }
}
```

Create `messages/en.json`:

```json
{
  "Home": {
    "title": "Kudjo",
    "subtitle": "A curated collection of Pokémon and One Piece TCG cards",
    "intro": "A digital showcase for collectors. Every piece selected, photographed, and verified with care."
  }
}
```

- [ ] **Step 8: Replace the root app files with locale-aware versions**

```bash
rm app/page.tsx app/layout.tsx
```

Create `app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Kudjo',
  description: 'Vetrina premium Pokémon & One Piece TCG',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Create `app/[locale]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <p>{t('intro')}</p>
    </main>
  );
}
```

- [ ] **Step 9: Verify build**

```bash
npm run build
```

Expected: exit code 0, build output lists `/it` and `/en` as generated static routes.

- [ ] **Step 10: Verify both locales serve translated content, and `/` redirects**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/it | grep "collezionisti"
curl -s http://localhost:3000/en | grep "collectors"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
kill %1
```

Expected: first `grep` prints the matching Italian line, second prints the matching English line, third prints `307` or `308` (redirect to `/it`).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Add next-intl IT/EN routing with placeholder home"
```

---

### Task 3: Design tokens — palette and fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `app/[locale]/layout.tsx` from Task 2.
- Produces: Tailwind utilities `bg-background`, `text-foreground`, `bg-bronze`, `text-bronze`, `border-bronze`, `font-display`, `font-sans` — available to every component built in later phases.

- [ ] **Step 1: Replace the color/font tokens in globals.css**

Replace the contents of `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #0b0b0c;
  --foreground: #f2ede4;
  --bronze: #9c7a52;
  --bronze-dark: #6b4f36;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-bronze: var(--bronze);
  --color-bronze-dark: var(--bronze-dark);
  --font-display: var(--font-fraunces);
  --font-sans: var(--font-inter);
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 2: Load Fraunces and Inter, apply them in the locale layout**

Replace the contents of `app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Kudjo',
  description: 'Vetrina premium Pokémon & One Piece TCG',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Apply the tokens on the placeholder home page**

Replace the contents of `app/[locale]/page.tsx`:

```tsx
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
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 5: Verify the token classes render**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/it | grep -o "font-display"
curl -s http://localhost:3000/it | grep -o "text-bronze"
kill %1
```

Expected: both `grep` calls print a match (`font-display`, `text-bronze`), confirming the classes are present in the rendered HTML.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Apply Kudjo design tokens: bronze/antracite palette, Fraunces + Inter"
```

---

### Task 4: Testing setup and domain config

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script)
- Create: `lib/config.ts`, `lib/config.test.ts`
- Create: `lib/schema/gioco.ts`, `lib/schema/gioco.test.ts`
- Create: `lib/schema/taxonomy.ts`, `lib/schema/taxonomy.test.ts`

**Interfaces:**
- Produces:
  - `SOGLIA_PREZZO_PUBBLICO: number` (`lib/config.ts`)
  - `GiocoSchema: ZodEnum`, `type Gioco = 'pokemon' | 'one_piece'` (`lib/schema/gioco.ts`) — the shared game-type used by every later schema task
  - `TIPO_CARTA_PER_GIOCO`, `RARITA_PER_GIOCO: Record<Gioco, readonly string[]>`, `isTipoCartaValido(gioco: Gioco, tipoCarta: string): boolean`, `isRaritaValida(gioco: Gioco, rarita: string): boolean` (`lib/schema/taxonomy.ts`)
  - `npm test` script running Vitest once

- [ ] **Step 1: Install Vitest and Zod**

```bash
npm install zod
npm install -D vitest
```

- [ ] **Step 2: Add the Vitest config and test script**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

In `package.json`, add to the `"scripts"` object:

```json
"test": "vitest run"
```

- [ ] **Step 3: Write the failing tests**

Create `lib/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SOGLIA_PREZZO_PUBBLICO } from './config';

describe('SOGLIA_PREZZO_PUBBLICO', () => {
  it('is set to 1000 euro', () => {
    expect(SOGLIA_PREZZO_PUBBLICO).toBe(1000);
  });
});
```

Create `lib/schema/gioco.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GiocoSchema } from './gioco';

describe('GiocoSchema', () => {
  it('accepts pokemon', () => {
    expect(GiocoSchema.parse('pokemon')).toBe('pokemon');
  });

  it('accepts one_piece', () => {
    expect(GiocoSchema.parse('one_piece')).toBe('one_piece');
  });

  it('rejects an unknown game', () => {
    expect(() => GiocoSchema.parse('magic')).toThrow();
  });
});
```

Create `lib/schema/taxonomy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isRaritaValida, isTipoCartaValido } from './taxonomy';

describe('isTipoCartaValido', () => {
  it('accepts a known Pokémon card type', () => {
    expect(isTipoCartaValido('pokemon', 'Pokémon')).toBe(true);
  });

  it('accepts a known One Piece card type', () => {
    expect(isTipoCartaValido('one_piece', 'Leader')).toBe(true);
  });

  it('rejects an unknown card type', () => {
    expect(isTipoCartaValido('pokemon', 'Not A Real Type')).toBe(false);
  });
});

describe('isRaritaValida', () => {
  it('accepts a known Pokémon rarity', () => {
    expect(isRaritaValida('pokemon', 'Hyper Rare')).toBe(true);
  });

  it('accepts a known One Piece rarity', () => {
    expect(isRaritaValida('one_piece', 'SEC')).toBe(true);
  });

  it('rejects an unknown rarity', () => {
    expect(isRaritaValida('one_piece', 'Mythic')).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests, verify they fail**

```bash
npx vitest run
```

Expected: FAIL — `Cannot find module './config'` (and similarly for `./gioco`, `./taxonomy`), since none of the source files exist yet.

- [ ] **Step 5: Implement the source files**

Create `lib/config.ts`:

```ts
export const SOGLIA_PREZZO_PUBBLICO = 1000;
```

Create `lib/schema/gioco.ts`:

```ts
import { z } from 'zod';

export const GiocoSchema = z.enum(['pokemon', 'one_piece']);
export type Gioco = z.infer<typeof GiocoSchema>;
```

Create `lib/schema/taxonomy.ts`:

```ts
import type { Gioco } from './gioco';

export const TIPO_CARTA_PER_GIOCO: Record<Gioco, readonly string[]> = {
  pokemon: [
    'Pokémon',
    'Trainer - Supporter',
    'Trainer - Item',
    'Trainer - Stadium',
    'Trainer - Tool',
    'Energy - Basic',
    'Energy - Special',
  ],
  one_piece: ['Leader', 'Character', 'Event', 'Stage', 'DON!!'],
};

export const RARITA_PER_GIOCO: Record<Gioco, readonly string[]> = {
  pokemon: [
    'Common',
    'Uncommon',
    'Rare',
    'Rare Holo',
    'Illustration Rare',
    'Special Illustration Rare',
    'ACE SPEC',
    'Hyper Rare',
  ],
  one_piece: ['C', 'UC', 'R', 'SR', 'SEC', 'L', 'SP'],
};

export function isTipoCartaValido(gioco: Gioco, tipoCarta: string): boolean {
  return TIPO_CARTA_PER_GIOCO[gioco].includes(tipoCarta);
}

export function isRaritaValida(gioco: Gioco, rarita: string): boolean {
  return RARITA_PER_GIOCO[gioco].includes(rarita);
}
```

- [ ] **Step 6: Run tests, verify they pass**

```bash
npm test
```

Expected: all 7 tests pass (`SOGLIA_PREZZO_PUBBLICO`: 1, `GiocoSchema`: 3, `isTipoCartaValido`/`isRaritaValida`: 3), exit code 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Vitest, SOGLIA_PREZZO_PUBBLICO, shared Gioco schema and taxonomy validators"
```

---

### Task 5: Zod schema — Set

**Files:**
- Create: `lib/schema/set.ts`, `lib/schema/set.test.ts`

**Interfaces:**
- Consumes: `GiocoSchema` from `lib/schema/gioco.ts` (Task 4).
- Produces: `SetSchema: ZodObject`, `type Set` (`lib/schema/set.ts`).

- [ ] **Step 1: Write the failing test**

Create `lib/schema/set.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SetSchema } from './set';

describe('SetSchema', () => {
  it('accepts a valid set', () => {
    const result = SetSchema.parse({
      id: 'set_op10',
      gioco: 'one_piece',
      nome: 'Royal Blood',
      codice_ufficiale: 'OP-10',
      data_uscita: '2025-01-31',
      numero_carte_totali: 121,
      fonte_esterna: 'optcgapi:OP10',
    });
    expect(result.codice_ufficiale).toBe('OP-10');
  });

  it('accepts a set without fonte_esterna', () => {
    const result = SetSchema.parse({
      id: 'set_sv08',
      gioco: 'pokemon',
      nome: 'Surging Sparks',
      codice_ufficiale: 'SV08',
      data_uscita: '2024-11-08',
      numero_carte_totali: 191,
    });
    expect(result.fonte_esterna).toBeUndefined();
  });

  it('rejects an unknown gioco', () => {
    expect(() =>
      SetSchema.parse({
        id: 'set_x',
        gioco: 'magic',
        nome: 'X',
        codice_ufficiale: 'X-1',
        data_uscita: '2024-01-01',
        numero_carte_totali: 10,
      }),
    ).toThrow();
  });

  it('rejects a non-positive numero_carte_totali', () => {
    expect(() =>
      SetSchema.parse({
        id: 'set_x',
        gioco: 'pokemon',
        nome: 'X',
        codice_ufficiale: 'X-1',
        data_uscita: '2024-01-01',
        numero_carte_totali: 0,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run lib/schema/set.test.ts
```

Expected: FAIL — `Cannot find module './set'`.

- [ ] **Step 3: Implement the schema**

Create `lib/schema/set.ts`:

```ts
import { z } from 'zod';
import { GiocoSchema } from './gioco';

export const SetSchema = z.object({
  id: z.string(),
  gioco: GiocoSchema,
  nome: z.string().min(1),
  codice_ufficiale: z.string().min(1),
  data_uscita: z.string().min(1),
  numero_carte_totali: z.number().int().positive(),
  fonte_esterna: z.string().optional(),
});

export type Set = z.infer<typeof SetSchema>;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test
```

Expected: all tests pass, including the 4 new `SetSchema` tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Set Zod schema"
```

---

### Task 6: Zod schema — CardDefinition

**Files:**
- Create: `lib/schema/card-definition.ts`, `lib/schema/card-definition.test.ts`

**Interfaces:**
- Produces: `CardDefinitionSchema: ZodObject`, `type CardDefinition` (`lib/schema/card-definition.ts`).

Note: `tipo_carta` and `rarita` are validated as non-empty strings here, not cross-checked against `lib/schema/taxonomy.ts` inside the schema — `CardDefinition` has no `gioco` field of its own (it belongs to the parent `Set`), so per-game validation happens where both are available together (future data-entry tooling), not inside this schema.

- [ ] **Step 1: Write the failing test**

Create `lib/schema/card-definition.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CardDefinitionSchema } from './card-definition';

describe('CardDefinitionSchema', () => {
  it('accepts a valid card definition', () => {
    const result = CardDefinitionSchema.parse({
      id: 'card_op10_119',
      set_id: 'set_op10',
      nome: 'Monkey D. Luffy',
      numero_raccolta: 'OP10-119',
      tipo_carta: 'Leader',
      rarita: 'L',
      lingua_stampa: 'en',
      fonte_esterna: 'optcgapi:OP10-119',
    });
    expect(result.nome).toBe('Monkey D. Luffy');
  });

  it('accepts a card definition without fonte_esterna', () => {
    const result = CardDefinitionSchema.parse({
      id: 'card_sv08_25',
      set_id: 'set_sv08',
      nome: 'Pikachu ex',
      numero_raccolta: '025/191',
      tipo_carta: 'Pokémon',
      rarita: 'Hyper Rare',
      lingua_stampa: 'it',
    });
    expect(result.fonte_esterna).toBeUndefined();
  });

  it('rejects an empty tipo_carta', () => {
    expect(() =>
      CardDefinitionSchema.parse({
        id: 'card_x',
        set_id: 'set_x',
        nome: 'X',
        numero_raccolta: '1/1',
        tipo_carta: '',
        rarita: 'Common',
        lingua_stampa: 'en',
      }),
    ).toThrow();
  });

  it('rejects a missing nome', () => {
    expect(() =>
      CardDefinitionSchema.parse({
        id: 'card_x',
        set_id: 'set_x',
        numero_raccolta: '1/1',
        tipo_carta: 'Pokémon',
        rarita: 'Common',
        lingua_stampa: 'en',
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run lib/schema/card-definition.test.ts
```

Expected: FAIL — `Cannot find module './card-definition'`.

- [ ] **Step 3: Implement the schema**

Create `lib/schema/card-definition.ts`:

```ts
import { z } from 'zod';

export const CardDefinitionSchema = z.object({
  id: z.string(),
  set_id: z.string(),
  nome: z.string().min(1),
  numero_raccolta: z.string().min(1),
  tipo_carta: z.string().min(1),
  rarita: z.string().min(1),
  lingua_stampa: z.string().min(1),
  fonte_esterna: z.string().optional(),
});

export type CardDefinition = z.infer<typeof CardDefinitionSchema>;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test
```

Expected: all tests pass, including the 4 new `CardDefinitionSchema` tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add CardDefinition Zod schema"
```

---

### Task 7: Zod schema — Variant

**Files:**
- Create: `lib/schema/variant.ts`, `lib/schema/variant.test.ts`

**Interfaces:**
- Produces: `TipoVarianteSchema: ZodEnum`, `type TipoVariante`, `VariantSchema: ZodObject`, `type Variant` (`lib/schema/variant.ts`).

- [ ] **Step 1: Write the failing test**

Create `lib/schema/variant.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { VariantSchema } from './variant';

describe('VariantSchema', () => {
  it('accepts a valid variant', () => {
    const result = VariantSchema.parse({
      id: 'var_1',
      card_definition_id: 'card_sv08_25',
      tipo_variante: 'alternate_art',
      note: 'Confezione booster box esclusiva',
    });
    expect(result.tipo_variante).toBe('alternate_art');
  });

  it('accepts a variant without note', () => {
    const result = VariantSchema.parse({
      id: 'var_2',
      card_definition_id: 'card_op10_119',
      tipo_variante: 'normale',
    });
    expect(result.note).toBeUndefined();
  });

  it('rejects an unknown tipo_variante', () => {
    expect(() =>
      VariantSchema.parse({
        id: 'var_3',
        card_definition_id: 'card_x',
        tipo_variante: 'ultra_rare_sparkly',
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run lib/schema/variant.test.ts
```

Expected: FAIL — `Cannot find module './variant'`.

- [ ] **Step 3: Implement the schema**

Create `lib/schema/variant.ts`:

```ts
import { z } from 'zod';

export const TipoVarianteSchema = z.enum([
  'normale',
  'holo',
  'reverse_holo',
  '1st_edition',
  'shadowless',
  'alternate_art',
  'full_art',
  'parallel',
  'manga_art',
  'secret_rare',
  'promo',
]);
export type TipoVariante = z.infer<typeof TipoVarianteSchema>;

export const VariantSchema = z.object({
  id: z.string(),
  card_definition_id: z.string(),
  tipo_variante: TipoVarianteSchema,
  note: z.string().optional(),
});

export type Variant = z.infer<typeof VariantSchema>;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test
```

Expected: all tests pass, including the 3 new `VariantSchema` tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Variant Zod schema"
```

---

### Task 8: Zod schema — Item

**Files:**
- Create: `lib/schema/item.ts`, `lib/schema/item.test.ts`

**Interfaces:**
- Produces: `CondizioneRawSchema: ZodEnum`, `StatoItemSchema: ZodEnum`, `ItemSchema: ZodObject`, `type Item` (`lib/schema/item.ts`).

- [ ] **Step 1: Write the failing test**

Create `lib/schema/item.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ItemSchema } from './item';

describe('ItemSchema', () => {
  it('accepts a valid graded item', () => {
    const result = ItemSchema.parse({
      id: 'item_1',
      variant_id: 'var_1',
      condizione_raw: 'NM',
      gradata: true,
      grading_company: 'PSA',
      voto: '9.5',
      foto: ['https://cdn.example.com/item_1_front.jpg'],
      prezzo: 450,
      stato: 'disponibile',
      nota_storia: 'Pull diretto da booster box',
      data_inserimento: '2026-07-01',
    });
    expect(result.stato).toBe('disponibile');
  });

  it('accepts a minimal ungraded item', () => {
    const result = ItemSchema.parse({
      id: 'item_2',
      variant_id: 'var_2',
      condizione_raw: 'LP',
      gradata: false,
      foto: [],
      prezzo: 0,
      stato: 'venduta',
      data_inserimento: '2026-06-15',
    });
    expect(result.gradata).toBe(false);
  });

  it('rejects an unknown condizione_raw', () => {
    expect(() =>
      ItemSchema.parse({
        id: 'item_3',
        variant_id: 'var_1',
        condizione_raw: 'MINT',
        gradata: false,
        foto: [],
        prezzo: 10,
        stato: 'disponibile',
        data_inserimento: '2026-07-01',
      }),
    ).toThrow();
  });

  it('rejects a negative prezzo', () => {
    expect(() =>
      ItemSchema.parse({
        id: 'item_4',
        variant_id: 'var_1',
        condizione_raw: 'NM',
        gradata: false,
        foto: [],
        prezzo: -5,
        stato: 'disponibile',
        data_inserimento: '2026-07-01',
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run lib/schema/item.test.ts
```

Expected: FAIL — `Cannot find module './item'`.

- [ ] **Step 3: Implement the schema**

Create `lib/schema/item.ts`:

```ts
import { z } from 'zod';

export const CondizioneRawSchema = z.enum(['NM', 'LP', 'MP', 'HP', 'DMG']);
export type CondizioneRaw = z.infer<typeof CondizioneRawSchema>;

export const StatoItemSchema = z.enum(['disponibile', 'riservata', 'venduta']);
export type StatoItem = z.infer<typeof StatoItemSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  variant_id: z.string(),
  condizione_raw: CondizioneRawSchema,
  gradata: z.boolean(),
  grading_company: z.enum(['PSA', 'CGC', 'BGS', 'AFA']).optional(),
  voto: z.string().optional(),
  foto: z.array(z.string()),
  prezzo: z.number().nonnegative(),
  stato: StatoItemSchema,
  nota_storia: z.string().optional(),
  data_inserimento: z.string().min(1),
});

export type Item = z.infer<typeof ItemSchema>;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test
```

Expected: all tests pass, including the 4 new `ItemSchema` tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Item Zod schema"
```

---

### Task 9: Zod schema — Richiesta and PropostaVendita

**Files:**
- Create: `lib/schema/richieste.ts`, `lib/schema/richieste.test.ts`

**Interfaces:**
- Consumes: `GiocoSchema` from `lib/schema/gioco.ts` (Task 4).
- Produces: `RichiestaSchema: ZodObject`, `type Richiesta`, `PropostaVenditaSchema: ZodObject`, `type PropostaVendita` (`lib/schema/richieste.ts`) — will be consumed by the contact API routes built in a later phase.

- [ ] **Step 1: Write the failing test**

Create `lib/schema/richieste.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PropostaVenditaSchema, RichiestaSchema } from './richieste';

describe('RichiestaSchema', () => {
  it('accepts a valid richiesta with item_riferimento', () => {
    const result = RichiestaSchema.parse({
      nome: 'Mario Rossi',
      contatto: 'mario@example.com',
      messaggio: 'Interessato a questa carta, è ancora disponibile?',
      item_riferimento: 'item_1',
      timestamp: '2026-07-01T10:00:00Z',
    });
    expect(result.item_riferimento).toBe('item_1');
  });

  it('accepts a richiesta without item_riferimento', () => {
    const result = RichiestaSchema.parse({
      nome: 'Giulia Bianchi',
      contatto: '+39 333 1234567',
      messaggio: 'Vorrei informazioni generali sulla collezione.',
      timestamp: '2026-07-01T11:00:00Z',
    });
    expect(result.item_riferimento).toBeUndefined();
  });

  it('rejects a missing nome', () => {
    expect(() =>
      RichiestaSchema.parse({
        contatto: 'mario@example.com',
        messaggio: 'Ciao',
        timestamp: '2026-07-01T10:00:00Z',
      }),
    ).toThrow();
  });
});

describe('PropostaVenditaSchema', () => {
  it('accepts a valid proposta di vendita', () => {
    const result = PropostaVenditaSchema.parse({
      nome: 'Luca Verdi',
      contatto: 'luca@example.com',
      gioco: 'pokemon',
      descrizione_carta: 'Charizard base set, condizioni buone, non gradata.',
      messaggio: 'Vorrei una valutazione.',
      timestamp: '2026-07-01T12:00:00Z',
    });
    expect(result.gioco).toBe('pokemon');
  });

  it('rejects an unknown gioco', () => {
    expect(() =>
      PropostaVenditaSchema.parse({
        nome: 'Luca Verdi',
        contatto: 'luca@example.com',
        gioco: 'magic',
        descrizione_carta: 'Una carta qualsiasi',
        messaggio: 'Ciao',
        timestamp: '2026-07-01T12:00:00Z',
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run lib/schema/richieste.test.ts
```

Expected: FAIL — `Cannot find module './richieste'`.

- [ ] **Step 3: Implement the schema**

Create `lib/schema/richieste.ts`:

```ts
import { z } from 'zod';
import { GiocoSchema } from './gioco';

export const RichiestaSchema = z.object({
  nome: z.string().min(1),
  contatto: z.string().min(1),
  messaggio: z.string().min(1),
  item_riferimento: z.string().optional(),
  timestamp: z.string().min(1),
});

export type Richiesta = z.infer<typeof RichiestaSchema>;

export const PropostaVenditaSchema = z.object({
  nome: z.string().min(1),
  contatto: z.string().min(1),
  gioco: GiocoSchema,
  descrizione_carta: z.string().min(1),
  messaggio: z.string().min(1),
  timestamp: z.string().min(1),
});

export type PropostaVendita = z.infer<typeof PropostaVenditaSchema>;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test
```

Expected: all tests pass, including the 5 new `RichiestaSchema`/`PropostaVenditaSchema` tests. Full suite total: 26 tests passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add Richiesta and PropostaVendita Zod schemas"
```

---

### Task 10: Deploy to Vercel

**Files:** none (deployment step)

**Interfaces:**
- Consumes: the full working build from Tasks 1–9.
- Produces: a public Vercel deployment URL.

- [ ] **Step 1: Final local build check**

```bash
npm run build
npm test
```

Expected: both exit code 0.

- [ ] **Step 2: Confirm .gitignore excludes Vercel local state**

Check `.gitignore` (created by `create-next-app` in Task 1) already contains a `.vercel` entry. If not, add it:

```
.vercel
```

- [ ] **Step 3: Deploy the project**

Use the available Vercel deployment tool for this project directory (`H:/Progetti AI/Kudjo`), creating a new Vercel project linked to it. This step requires the user to confirm/authorize the Vercel connection — pause and ask before proceeding if the tool prompts for authorization.

- [ ] **Step 4: Verify the deployment is live**

Once a deployment URL is returned, verify it responds:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "<deployment-url>/it"
```

Expected: `200`.

- [ ] **Step 5: Commit any deployment config files**

If the deploy step created tracked config (e.g. `vercel.json`), commit it:

```bash
git add -A
git commit -m "Add Vercel deployment config"
```

If nothing new was created (deployment state lives only in `.vercel/`, already gitignored), skip the commit.

---

## Completion Check

After Task 10, the spec's verification criteria (design doc, "Verifica di completamento") should all hold:
- `npm run build` completes without errors.
- `npm run dev` serves translated content on `/it` and `/en`.
- `npm test` passes for all Zod schemas (26 tests across `config`, `gioco`, `taxonomy`, `set`, `card-definition`, `variant`, `item`, `richieste`).
- The Vercel deployment URL is publicly reachable.
