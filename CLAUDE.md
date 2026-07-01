# Kudjo — Vetrina Premium Pokémon & One Piece TCG

> Questo file va salvato come `CLAUDE.md` nella root del repository.
> Claude Code lo legge automaticamente a inizio sessione: non serve incollarlo in chat,
> basta lanciare `claude` dentro la cartella del progetto.

---

## 1. Visione

**Kudjo** è il sito vetrina digitale per una collezione curata di carte fisiche Pokémon
e One Piece TCG. Obiettivo: comunicare autorevolezza e cura da "dealer selezionato",
generare contatti qualificati da collezionisti interessati, costruire presenza SEO sui
nomi di carte/set. Sito bilingue italiano/inglese fin dal lancio.

**Non è un e-commerce. Non è un'asta.** Nessun carrello, nessun pagamento online,
nessun meccanismo di bidding. La vendita avviene fuori piattaforma (contatto diretto).

**Relazione con il progetto "piattaforma asta"**: confermato — questo sito è l'MVP core
del progetto più ampio, non un esperimento a sé stante. La tassonomia delle carte (sezione
4) è quindi lo strato che deve sopravvivere al passaggio alla piattaforma completa: è
definita con schema tipizzato (Zod, vedi sezione 5) invece che come JSON ad-hoc, proprio
per poter migrare a un database Postgres reale come cambio di storage — non come redesign.

## 2. Cosa esclude esplicitamente (non-goal)

- Nessun carrello / checkout / pagamento online
- Nessun meccanismo d'asta o proxy bidding
- Nessun account utente obbligatorio (opzionale solo per newsletter)
- Nessuna chat live in-app — solo form strutturato + link diretti (email/WhatsApp)
- Nessuna gestione di inventario/stock automatizzata: aggiornamento manuale o via CMS leggero

⚠️ Nota di prodotto: poiché la trattativa avviene fuori piattaforma, il sito non offre
protezione/escrow all'acquirente. Prevedere un disclaimer visibile ("le transazioni si
concludono privatamente, al di fuori del sito") — non è un obbligo legale stringente dato
che non gestite pagamenti, ma è igiene reputazionale per un brand che vuole posizionarsi
come affidabile.

## 3. Struttura del sito

Ogni pagina disponibile in italiano e inglese (toggle IT/EN, vedi stack in sezione 5).

- **Home** — hero, pezzi in evidenza, breve storytelling del brand
- **Collezione** — griglia sfogliabile, filtri per gioco (Pokémon / One Piece), set, rarità,
  condizione, fascia prezzo o "su richiesta"
- **Scheda carta** — galleria foto, report condizione, eventuale nota di provenienza/storia,
  CTA "Richiedi informazioni"
- **Chi siamo / La storia** — posizionamento come dealer curato, non marketplace generico
- **Vendici la tua carta** — form di contatto per chi vuole proporre carte in vendita a
  Kudjo (v1 confermato). Resta una richiesta di contatto, non una transazione: nessuna
  offerta automatica, nessun upload pubblico di file nella v1 (vedi sezione 8)
- **Contatti** — form + link diretti WhatsApp/Telegram/email
- **Legal** — privacy, termini, disclaimer sulle transazioni private

## 4. Tassonomia delle carte

Schema pensato per essere condiviso 1:1 con la futura piattaforma asta. Due livelli
separati: **riferimento** (identità canonica della carta, non cambia mai) e **inventario**
(il pezzo fisico che possiedi, con condizione/prezzo/stato). Separarli ora è la decisione
chiave: quando arriverà l'asta, i campi transazionali (prezzo base, riserva, bid corrente,
scadenza) si aggiungono solo al livello Item, senza mai toccare Set/CardDefinition/Variant.

```
Set:
  id, gioco (pokemon | one_piece), nome, codice_ufficiale (es. "OP-10", "SV08"),
  data_uscita, numero_carte_totali, fonte_esterna (id nel database di riferimento)

CardDefinition (identità canonica, indipendente dalla copia fisica):
  id, set_id, nome, numero_raccolta (es. "025/198", "OP10-119"),
  tipo_carta (stringa — vedi lista sotto, per gioco),
  rarita (stringa — vedi nota sotto),
  lingua_stampa, fonte_esterna (id nel database di riferimento)

Variant (versione di stampa specifica — incide molto sul valore):
  id, card_definition_id,
  tipo_variante (enum: normale, holo, reverse_holo, 1st_edition, shadowless,
  alternate_art, full_art, parallel, manga_art, secret_rare, promo),
  note

Item (il pezzo fisico che possiedi e mostri in vetrina — qui vivranno domani i campi asta):
  id, variant_id,
  condizione_raw (enum: NM | LP | MP | HP | DMG — scala standard TCG),
  gradata (bool), grading_company (PSA/CGC/BGS/AFA, opzionale), voto (es. "9.5"),
  foto[], prezzo (numero, sempre valorizzato internamente),
  stato (disponibile | riservata | venduta),
  nota_storia, data_inserimento
```

**Regola di visualizzazione prezzo**: il campo `prezzo` è sempre valorizzato (serve per
gestione interna), ma la UI pubblica lo mostra solo se `prezzo <= SOGLIA_PREZZO_PUBBLICO`
(costante di config, valore iniziale **1000€**); sopra soglia la scheda mostra "Su
richiesta" con CTA di contatto. Tenerla come costante configurabile in un solo punto
(non hardcoded nei componenti), così è facile cambiarla senza toccare il codice.

⚠️ **Attenzione a non confondere due concetti diversi che si chiamano entrambi
"lingua"**: `lingua_stampa` in `CardDefinition` è la lingua di stampa fisica della carta
(una carta può esistere in edizione IT o EN indipendentemente da chi la guarda); la
lingua dell'interfaccia IT/EN (sezione 3) è tutt'altra cosa — riguarda i testi del sito,
non il catalogo. Vanno implementate con meccanismi separati (i18n del sito vs. attributo
del dato) per evitare che un filtro "mostra sito in inglese" nasconda per errore le carte
in edizione italiana o viceversa.

**Perché `tipo_carta` e `rarita` sono stringhe libere e non enum fissi**: entrambi i
giochi introducono nuove categorie a ogni era. Pokémon ha aggiunto Illustration Rare,
Special Illustration Rare, ACE SPEC, Hyper Rare negli ultimi set; One Piece TCG usa
C / UC / R / SR / SEC / L / SP. Un enum fisso in TypeScript si romperebbe a ogni nuovo
set. Meglio validare contro una lista aggiornabile per gioco (un semplice array in un
file di config) invece che nello schema stesso.

**Valori tipici di `tipo_carta` (lista di partenza, non esaustiva)**
- Pokémon: Pokémon (Base/Stage 1/Stage 2/ex/VMAX/VSTAR...), Trainer (Supporter/Item/
  Stadium/Tool), Energy (Basic/Special)
- One Piece TCG: Leader, Character, Event, Stage, DON!!

**Fonti esterne per compilare/validare il livello di riferimento** — usarle solo in fase
di inserimento carta (script/CMS), mai come chiamata live nella UI pubblica:
- [apitcg.com](https://www.apitcg.com/) — copre sia Pokémon sia One Piece nella stessa
  API (oltre a Digimon, Dragon Ball, MTG, Gundam): è l'opzione più comoda perché eviti di
  integrare due fonti diverse per i due giochi
- [optcgapi.com](https://optcgapi.com/) — alternativa gratuita dedicata solo a One Piece
  TCG, copre tutti i set fino ad oggi
- pokemontcg.io (ora confluita in "Scrydex") — storicamente la fonte più usata per dati
  Pokémon, ma di recente segnala tempi di risposta lenti e affidabilità incostante:
  trattarla come arricchimento opzionale in fase di data-entry, non come dipendenza

## 5. Stack tecnico consigliato

Deliberatamente più leggero rispetto al progetto asta (Next.js + NestJS + WebSocket +
Postgres/Redis + Stripe): qui non servono backend separato, code bidding né pagamenti.

- **Next.js 15 (App Router)** — frontend + poche API route per il form contatti.
  Stessa base del progetto asta futuro, per facilitare un eventuale merge.
- **Zod** — schema di validazione runtime per Set/CardDefinition/Variant/Item (sezione 4).
  Anche se lo storage per l'MVP è solo JSON, avere lo schema tipizzato rende il passaggio
  a un database reale un cambio di storage, non un redesign.
- **next-intl** — i18n per il toggle italiano/inglese dell'interfaccia (sezione 3). Non va
  confuso con `lingua_stampa` del catalogo (sezione 4): sono due meccanismi separati.
- **Contenuti**: file Markdown/JSON nel repo per l'MVP; CMS headless solo se il volume
  di carte cresce e serve un'interfaccia di editing per chi non è tecnico.
- **Immagini**: Next.js `<Image>` per l'ottimizzazione automatica; storage su Vercel Blob
  o Cloudinary free tier per le foto originali.
- **Form contatti**: API route serverless → invio email via Resend (free tier generoso)
  oppure, per la versione più minimale, semplice `mailto:` / link WhatsApp click-to-chat
  senza backend.
- **Hosting**: Vercel (free tier, deploy diretto da GitHub).
- **Niente** NestJS, WebSocket, Redis, Stripe in questa fase.

### 5.1 Motion e interazione — qui deve "sentirsi" premium

L'errore comune è pensare che "più bello" significhi più librerie/animazioni. I siti di
lusso presi a riferimento (Chrono24, case d'asta) sono percepiti come costosi perché si
muovono *poco*, non nonostante questo. Meglio 2 interazioni firmate, curate bene, che
dieci effetti generici sparsi ovunque.

- **Motion** (ex Framer Motion) — solo per transizioni di pagina e reveal in scroll,
  usata con parsimonia
- **Effetto "holo tilt" sulla card** — l'interazione di firma del sito: al passaggio del
  mouse (o al tocco su mobile) la card ruota leggermente in prospettiva. Se l'Item ha lo
  scatto angolato dedicato (sezione 7.1), l'effetto sfuma tra la foto dritta e quella
  angolata seguendo il puntatore — riflesso olografico reale, non simulato. Per le carte
  non-holo (o finché non sono disponibili entrambi gli scatti) si usa un fallback CSS
  puro (gradiente agganciato alla posizione del cursore, nessuna libreria 3D necessaria)
- **View Transitions API** di Next.js (sperimentale) per una transizione fluida tra
  griglia Collezione e Scheda carta — l'immagine "vola" da un layout all'altro invece di
  un semplice fade, tipo pagina prodotto Apple
- **shadcn/ui** come base di componenti accessibili, ma ristilizzata pesantemente sulla
  palette della sezione 6 — usata "di fabbrica" si riconosce a colpo d'occhio e vanifica
  proprio l'effetto premium cercato

## 6. Direzione visiva — Premium, non fumetteria

**Riferimenti di posizionamento**: cataloghi digitali di case d'asta (Sotheby's,
Christie's), piattaforme di resale di lusso (StockX/GOAT per le sneaker, Chrono24 per
gli orologi). Non: negozi di fumetti, siti da fiera/Romics, grafica "gamer".

**Palette colori**
- Base: nero/antracite profondo OPPURE avorio/crema caldo (scegliere una direzione, non
  mischiare) come sfondo dominante
- Un solo accento cromatico usato con parsimonia: oro scuro, bordeaux, o verde foresta
- Evitare colori primari accesi, gradienti sgargianti, arcobaleno da set booster

**Tipografia**
- Coppia serif editoriale (titoli) + sans moderno pulito (corpo/UI)
- Opzioni gratuite via Google Fonts: **Fraunces** o **Playfair Display** per i titoli,
  **Inter** o **Geist** per il testo
- Evitare font "da fumetto", grassetti aggressivi, effetti 3D/bevel sui titoli

**Fotografia**
- Trattare le carte come gioielli o orologi: macro dettagliate, luce da studio morbida,
  sfondi neutri o scuri, inquadratura e proporzioni coerenti su tutto il catalogo
- Questa coerenza visiva è il vero segnale di cura/autenticità — più della singola foto

**Layout**
- Spazio bianco generoso, griglia editoriale, immagini grandi, pochissimo "chrome" di UI
- Micro-animazioni sobrie (fade, leggero parallasse) invece di effetti vistosi

**Da evitare esplicitamente**: colori primari accesi, pattern a puntini/halftone stile
fumetto, badge/timbri/etichette "PROMO", ombre e bevel anni 2010, font tondi/giocosi.

## 7. Strategia immagini

**Principio guida**: le foto delle carte sono SEMPRE fotografie reali dei pezzi fisici.
Non generare mai con AI artwork che raffiguri personaggi Pokémon o One Piece — sono IP
protette da copyright/trademark (Nintendo/Game Freak/Bandai), il rischio legale non vale
il beneficio, e comunque un dealer "curato" vende su autenticità reale, non su immagini
sintetiche.

L'AI/stock si usa solo per elementi di supporto **senza personaggi**: sfondi, texture,
elementi decorativi, icone.

**Fotografia stock (sfondi, texture, momenti editoriali)**
- [Pexels API](https://www.pexels.com/api/) — gratuita, nessun costo nascosto, rate limit
  200 richieste/ora di base (estendibile su richiesta), foto e video, uso commerciale
  libero senza obbligo di attribuzione
- [Pixabay API](https://pixabay.com/) — gratuita, licenza permissiva, comoda se volete
  scaricare e servire le immagini dal vostro CDN invece che in hotlink
- [Unsplash API](https://unsplash.com/developers) — qualità fotografica più alta ma rate
  limit più basso (50/ora) e richiede attribuzione visibile nell'app in produzione
- Nota legale comune a tutte e tre: nessuna garanzia di model release per persone
  riconoscibili nelle foto — per una vetrina di sole carte non è un problema rilevante

**Generazione AI (solo per texture/sfondi astratti, mai personaggi con IP)**
- [Pollinations.ai](https://pollinations.ai) — API gratuita e open source, nessuna
  registrazione richiesta per l'uso base, modello Flux gratuito e illimitato per la fascia
  free; utile per generare texture di sfondo (velluto, marmo, superfici da studio
  fotografico) da usare come elementi decorativi del layout

**Icone**
- Lucide Icons (già incluso nell'ecosistema React/Next.js) o Phosphor Icons — set gratuiti,
  open source, coerenti con un'estetica minimale

### 7.1 Fotografia del catalogo (le foto vere, da produrre)

Setup minimo per foto coerenti su tutto il catalogo, senza attrezzatura professionale:

- **Sfondo**: un unico sfondo neutro per tutte le carte (feltro/velluto nero, o cartoncino
  grigio/bianco opaco) — la ripetizione è ciò che comunica cura, più della singola foto
- **Luce**: luce diffusa (finestra con luce indiretta, o softbox/ring light con diffusore).
  Evitare luce diretta puntuale: sulle carte lucide/holo crea riflessi che bruciano i
  dettagli
- **Angolo**: definire un angolo fisso per lo scatto "principale" (dall'alto, carta
  perfettamente in piano) da usare come immagine di copertina uniforme in griglia
- **Carte holo/foil**: scattare **due foto per la stessa carta** — una dritta (immagine
  principale) e una leggermente angolata per catturare la sfumatura olografica. La seconda
  foto alimenta l'effetto "holo tilt" della sezione 5.1: invece di simulare l'olografia
  solo via CSS, il sito può sfumare tra i due scatti reali al passaggio del mouse — più
  autentico di un effetto puramente sintetico
- **Protezione**: se le carte sono in toploader/bustina rigida durante lo scatto, occhio
  ai riflessi della plastica — spesso conviene un filtro polarizzatore, oppure togliere la
  protezione solo per la foto (con le dovute precauzioni di maneggio)

## 8. Flusso di contatto

- CTA principale su ogni scheda carta: "Richiedi informazioni" → form (nome, contatto,
  messaggio precompilato col riferimento della carta) → invio via email e/o link
  WhatsApp click-to-chat
- Nessuna negoziazione o messaggistica in-app: il sito resta una vetrina, non un canale
  di trattativa, per contenere complessità e responsabilità
- Newsletter opzionale per aggiornamenti su nuovi arrivi in catalogo

```
Richiesta:
  nome, contatto (email/telefono), messaggio, item_riferimento (opzionale, id da sezione 4),
  timestamp
```

**Vendici la tua carta** — stesso principio: richiesta di contatto, non transazione.

```
PropostaVendita:
  nome, contatto (email/telefono), gioco (pokemon | one_piece),
  descrizione_carta (testo libero: nome, set, condizione percepita),
  messaggio, timestamp
```

Scelta di default per la v1: **nessun upload di foto dal form pubblico**. Costruire una
pipeline di upload (storage, validazione file, rischio di abuso/spam) è complessità che
l'MVP non richiede. Il form chiude con un invito a inviare le foto via WhatsApp o email
dopo il primo contatto. Se in futuro il volume di proposte lo giustifica, si aggiunge
upload diretto senza dover ridisegnare lo schema (`PropostaVendita` può guadagnare un
campo `foto[]` in un secondo momento).

## 9. Roadmap per Claude Code

- **Fase 0** — scaffold repo, design tokens (colori/font da sezione 6), schema Zod
  (sezione 4), setup Next.js + next-intl (IT/EN), deploy scheletro su Vercel
- **Fase 1** — pagine statiche (Home, Chi siamo, Contatti, Vendici la tua carta) con
  sistema di stile applicato, in entrambe le lingue
- **Fase 2** — Collezione + scheda carta con dati mock, effetto holo-tilt (sezione 5.1),
  regola soglia prezzo (sezione 4)
- **Fase 3** — form di contatto e form "Vendici la tua carta" funzionanti + integrazione
  email
- **Fase 4** — shooting fotografico (sezione 7.1) + flusso di inserimento nuove carte
  (JSON manuale o CMS leggero)
- **Fase 5** — SEO (bilingue), analytics, polish finale, pubblicazione

## 10. Domande aperte da sciogliere prima/durante lo sviluppo

- **Dominio**: `kudjo.com` risulta già registrato da terzi. `kudjo.io` (~38$/anno) e
  `kudjo.shop` (~3$ il primo anno, poi verificare rinnovo) risultano liberi su Vercel.
  `kudjo.it` risulta libero ma va verificato/registrato su un registrar italiano — utile
  da avere comunque, visto il mercato IT
- Sopra la soglia dei 1000€ (sezione 4), il form "Richiedi informazioni" deve differenziarsi
  in copy da quello sotto soglia (es. tono più da consulenza personalizzata)? È un
  dettaglio di UX copy, non blocca lo sviluppo — da rifinire in fase 3
- Con le domande già individuate per il progetto asta (return policy, corrieri, foto
  pre-spedizione obbligatorie, custodia P2P vs B2C): visto che Kudjo è l'MVP core dello
  stesso progetto, ha senso portarle alla stessa call col cliente invece di deciderle
  separatamente ora
