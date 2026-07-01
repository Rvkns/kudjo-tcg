# Kudjo — Fase 0: Scaffold tecnico

Data: 2026-07-01
Stato: approvato

## Obiettivo

Costruire la base tecnica su cui poggeranno tutte le fasi successive del sito
Kudjo (vedi roadmap in `CLAUDE.md`, sezione 9). Questa fase produce
infrastruttura, non contenuto: a fine fase esiste un progetto Next.js
avviabile, con design tokens applicati, schema dati tipizzato, i18n
funzionante su una home placeholder, e un deploy pubblico su Vercel.

Non fanno parte di questa fase: pagine di contenuto reali, dati mock del
catalogo, form funzionanti, componenti shadcn/ui, effetto holo-tilt.

## Stack e struttura progetto

- **Next.js 15** (App Router) + TypeScript, scaffoldato con `create-next-app`
  (Tailwind CSS incluso di default nello scaffold corrente).
- **npm** come package manager.
- **Zod** per lo schema dati.
- **next-intl** per l'i18n IT/EN.

Struttura cartelle:

```
app/[locale]/              routing i18n (it/en), layout + home placeholder
messages/it.json            stringhe UI in italiano
messages/en.json            stringhe UI in inglese
lib/schema/set.ts           schema Zod: Set
lib/schema/card-definition.ts   schema Zod: CardDefinition
lib/schema/variant.ts       schema Zod: Variant
lib/schema/item.ts          schema Zod: Item
lib/schema/richieste.ts     schema Zod: Richiesta, PropostaVendita
lib/schema/taxonomy.ts      liste tipo_carta/rarita per gioco (config, non enum)
lib/config.ts               costanti globali (SOGLIA_PREZZO_PUBBLICO)
```

Ogni file di schema esporta sia lo schema Zod sia il tipo TypeScript derivato
con `z.infer<typeof Schema>` — nessun tipo duplicato a mano.

## Design tokens (CLAUDE.md sezione 6)

- **Palette**: base nero/antracite profondo come sfondo dominante, testo
  avorio/off-white per contrasto. Un solo accento cromatico: bronzo (tono
  caldo, opaco — non oro lucido/metallizzato), usato con parsimonia per CTA,
  bordi attivi, dettagli.
- **Font**: **Fraunces** (titoli, serif editoriale) + **Inter** (corpo/UI),
  caricati via `next/font/google`, esposti come variabili CSS.
- Tutti i valori (colori, font, spaziature chiave) vivono in
  `tailwind.config.ts` come token — nessun colore o font hardcoded nei
  componenti.

## i18n (CLAUDE.md sezione 3, 5)

- Routing basato su `[locale]` con `next-intl`, lingue supportate `it`
  (default) ed `en`, toggle nella navigazione.
- Home placeholder che dimostra il toggle funzionante (titolo, sottotitolo,
  un paragrafo — testo reale minimo, non lorem ipsum).
- Nota di design esplicita: questo meccanismo (lingua interfaccia) resta
  separato dal campo `lingua_stampa` di `CardDefinition` (lingua di stampa
  fisica della carta). Non condividono codice né tipi.

## Schema dati (CLAUDE.md sezione 4, 8)

Implementazione 1:1 della tassonomia descritta in `CLAUDE.md`:

- `Set`: id, gioco (`pokemon | one_piece`), nome, codice_ufficiale,
  data_uscita, numero_carte_totali, fonte_esterna.
- `CardDefinition`: id, set_id, nome, numero_raccolta, tipo_carta (stringa,
  validata contro lista per-gioco in `taxonomy.ts`), rarita (stringa, stessa
  logica), lingua_stampa, fonte_esterna.
- `Variant`: id, card_definition_id, tipo_variante (enum fisso: normale,
  holo, reverse_holo, 1st_edition, shadowless, alternate_art, full_art,
  parallel, manga_art, secret_rare, promo), note.
- `Item`: id, variant_id, condizione_raw (enum: NM/LP/MP/HP/DMG), gradata
  (bool), grading_company (opzionale), voto (opzionale), foto (array),
  prezzo (numero), stato (`disponibile | riservata | venduta`), nota_storia,
  data_inserimento.
- `Richiesta` (sezione 8): nome, contatto, messaggio, item_riferimento
  (opzionale), timestamp.
- `PropostaVendita` (sezione 8): nome, contatto, gioco, descrizione_carta,
  messaggio, timestamp. Niente campo `foto[]` in questa fase (v1 esplicita:
  nessun upload dal form pubblico).

`taxonomy.ts` contiene le liste iniziali di `tipo_carta` per gioco riportate
in sezione 4 (non esaustive, aggiornabili senza toccare lo schema).

`lib/config.ts` esporta `SOGLIA_PREZZO_PUBBLICO = 1000` come unico punto di
verità per la regola di visualizzazione prezzo — usata a partire dalla Fase 2,
ma definita già ora perché è un valore di dominio, non di UI.

## Deploy

- `git init` locale (già fatto) con commit incrementali durante lo sviluppo.
- Deploy reale su Vercel tramite gli strumenti disponibili, verso un
  progetto nuovo collegato a questa cartella. Se il flusso richiede
  login/autorizzazione, viene chiesta conferma esplicita prima di procedere.

## Verifica di completamento

- `npm run build` completa senza errori.
- `npm run dev` avvia il progetto in locale; home raggiungibile su `/it` e
  `/en` con testo tradotto correttamente.
- `npx tsc --noEmit` (o equivalente) passa senza errori sugli schema Zod.
- Deploy Vercel raggiungibile via URL pubblico.
