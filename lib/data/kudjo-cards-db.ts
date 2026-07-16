import { type KudjoCard, type KudjoCardInstance, type KudjoPendingPack } from '../schema/kudjo-card';

// ─────────────────────────────────────────────────────────────────────────────
// KUDJO ORIGINAL SET I – 55 Carte Digitali Fittizie
// Distribuzione: 30 Comuni (C), 17 Non Comuni (NC), 8 Rare (R)
// ─────────────────────────────────────────────────────────────────────────────

export const kudjoCards: KudjoCard[] = [
  // ── COMUNI (30) ──────────────────────────────────────────────────────────
  { id: 'kj_001', numero: 1,  nome: 'Fiammeggino',     elemento: 'fuoco',    rarita: 'comune',     descrizione: 'Una piccola fiamma che danza irrequieta.', potere: 15 },
  { id: 'kj_002', numero: 2,  nome: 'Ondina',          elemento: 'acqua',    rarita: 'comune',     descrizione: 'Spirito d\'acqua che dorme nei ruscelli.', potere: 14 },
  { id: 'kj_003', numero: 3,  nome: 'Radichetta',      elemento: 'terra',    rarita: 'comune',     descrizione: 'Piccola radice che affonda nei terreni fertili.', potere: 12 },
  { id: 'kj_004', numero: 4,  nome: 'Ombrina',         elemento: 'ombra',    rarita: 'comune',     descrizione: 'Un\'ombra che si muove anche senza luce.', potere: 16 },
  { id: 'kj_005', numero: 5,  nome: 'Scintilla',       elemento: 'fulmine',  rarita: 'comune',     descrizione: 'Una piccola scarica elettrica dal nulla.', potere: 18 },
  { id: 'kj_006', numero: 6,  nome: 'Cristallino',     elemento: 'ghiaccio', rarita: 'comune',     descrizione: 'Cristallo di ghiaccio nato in alta quota.', potere: 13 },
  { id: 'kj_007', numero: 7,  nome: 'Draghetto',       elemento: 'drago',    rarita: 'comune',     descrizione: 'Cucciolo di drago alle prime prove di volo.', potere: 20 },
  { id: 'kj_008', numero: 8,  nome: 'Lucerella',       elemento: 'luce',     rarita: 'comune',     descrizione: 'Un raggio di luce che si posa sui fiori.', potere: 11 },
  { id: 'kj_009', numero: 9,  nome: 'Braciere',        elemento: 'fuoco',    rarita: 'comune',     descrizione: 'Tizzoni ardenti che non si spengono mai.', potere: 17 },
  { id: 'kj_010', numero: 10, nome: 'Gocciolino',      elemento: 'acqua',    rarita: 'comune',     descrizione: 'Una singola goccia capace di scavare la roccia.', potere: 13 },
  { id: 'kj_011', numero: 11, nome: 'Granito',         elemento: 'terra',    rarita: 'comune',     descrizione: 'Frammento di granito antico come il mondo.', potere: 19 },
  { id: 'kj_012', numero: 12, nome: 'Nebbia Oscura',   elemento: 'ombra',    rarita: 'comune',     descrizione: 'Nebbiolina scura che offusca i sensi.', potere: 14 },
  { id: 'kj_013', numero: 13, nome: 'Voltino',         elemento: 'fulmine',  rarita: 'comune',     descrizione: 'Piccolo shock che fa tremare le dita.', potere: 16 },
  { id: 'kj_014', numero: 14, nome: 'Galaverna',       elemento: 'ghiaccio', rarita: 'comune',     descrizione: 'Brina mattutina che ricopre le foglie.', potere: 12 },
  { id: 'kj_015', numero: 15, nome: 'Scalotto',        elemento: 'drago',    rarita: 'comune',     descrizione: 'Piccola scaglia di drago caduta durante il volo.', potere: 18 },
  { id: 'kj_016', numero: 16, nome: 'Albaluce',        elemento: 'luce',     rarita: 'comune',     descrizione: 'Il primo bagliore dell\'alba su un lago calmo.', potere: 10 },
  { id: 'kj_017', numero: 17, nome: 'Brace Viva',      elemento: 'fuoco',    rarita: 'comune',     descrizione: 'Brace che pulsa lentamente sotto la cenere.', potere: 15 },
  { id: 'kj_018', numero: 18, nome: 'Spruzzetto',      elemento: 'acqua',    rarita: 'comune',     descrizione: 'Minuscolo geyser che sgorga dai prati.', potere: 11 },
  { id: 'kj_019', numero: 19, nome: 'Argilla',         elemento: 'terra',    rarita: 'comune',     descrizione: 'Zolla di argilla morbida e plasmabile.', potere: 13 },
  { id: 'kj_020', numero: 20, nome: 'Velo di Tenebra', elemento: 'ombra',    rarita: 'comune',     descrizione: 'Un sottile velo che oscura la visione.', potere: 17 },
  { id: 'kj_021', numero: 21, nome: 'Lamella',         elemento: 'fulmine',  rarita: 'comune',     descrizione: 'Piccola lamella metallica carica di elettricità.', potere: 14 },
  { id: 'kj_022', numero: 22, nome: 'Stelo di Gelo',   elemento: 'ghiaccio', rarita: 'comune',     descrizione: 'Ramoscello di ghiaccio puro e trasparente.', potere: 15 },
  { id: 'kj_023', numero: 23, nome: 'Squamino',        elemento: 'drago',    rarita: 'comune',     descrizione: 'Scaglia iridescente di un drago giovane.', potere: 16 },
  { id: 'kj_024', numero: 24, nome: 'Faville',         elemento: 'luce',     rarita: 'comune',     descrizione: 'Piccole faville dorate che svaniscono nell\'aria.', potere: 12 },
  { id: 'kj_025', numero: 25, nome: 'Fiaccola',        elemento: 'fuoco',    rarita: 'comune',     descrizione: 'Torcia portatile che illumina le caverne buie.', potere: 18 },
  { id: 'kj_026', numero: 26, nome: 'Risacca',         elemento: 'acqua',    rarita: 'comune',     descrizione: 'Onda che torna indietro portando segreti del mare.', potere: 16 },
  { id: 'kj_027', numero: 27, nome: 'Sassolino',       elemento: 'terra',    rarita: 'comune',     descrizione: 'Ciottolo levigato dai fiumi di montagna.', potere: 10 },
  { id: 'kj_028', numero: 28, nome: 'Penombra',        elemento: 'ombra',    rarita: 'comune',     descrizione: 'Zona di confine tra luce e oscurità.', potere: 15 },
  { id: 'kj_029', numero: 29, nome: 'Elettrino',       elemento: 'fulmine',  rarita: 'comune',     descrizione: 'Piccola particella di energia elettrica.', potere: 13 },
  { id: 'kj_030', numero: 30, nome: 'Bruma Artica',    elemento: 'ghiaccio', rarita: 'comune',     descrizione: 'Nebbia gelida proveniente dalle terre del nord.', potere: 14 },

  // ── NON COMUNI (17) ───────────────────────────────────────────────────────
  { id: 'kj_031', numero: 31, nome: 'Pyrovex',         elemento: 'fuoco',    rarita: 'non_comune', descrizione: 'Guardiano delle camere di lava vulcanica.', potere: 35 },
  { id: 'kj_032', numero: 32, nome: 'Tidalcrest',      elemento: 'acqua',    rarita: 'non_comune', descrizione: 'Spirito marino che cavalca le creste delle onde.', potere: 32 },
  { id: 'kj_033', numero: 33, nome: 'Thornbrak',       elemento: 'terra',    rarita: 'non_comune', descrizione: 'Guardiano antico della foresta primordiale.', potere: 38 },
  { id: 'kj_034', numero: 34, nome: 'Veilshade',       elemento: 'ombra',    rarita: 'non_comune', descrizione: 'Cacciatore notturno che non proietta ombra.', potere: 40 },
  { id: 'kj_035', numero: 35, nome: 'Volthorn',        elemento: 'fulmine',  rarita: 'non_comune', descrizione: 'Bestia elettrica dei piani aperti e tempestosi.', potere: 42 },
  { id: 'kj_036', numero: 36, nome: 'Glacivex',        elemento: 'ghiaccio', rarita: 'non_comune', descrizione: 'Custode dei picchi eterni ricoperti di ghiaccio.', potere: 36 },
  { id: 'kj_037', numero: 37, nome: 'Drakkar',         elemento: 'drago',    rarita: 'non_comune', descrizione: 'Giovane drago che percorre rotte celesti.', potere: 45 },
  { id: 'kj_038', numero: 38, nome: 'Luminar',         elemento: 'luce',     rarita: 'non_comune', descrizione: 'Entità luminosa che guida i persi nel buio.', potere: 33 },
  { id: 'kj_039', numero: 39, nome: 'Ignarix',         elemento: 'fuoco',    rarita: 'non_comune', descrizione: 'Fenice minore rinata dalle sue stesse ceneri.', potere: 44 },
  { id: 'kj_040', numero: 40, nome: 'Abyssein',        elemento: 'acqua',    rarita: 'non_comune', descrizione: 'Leviatano delle profondità marine inesplorate.', potere: 39 },
  { id: 'kj_041', numero: 41, nome: 'Mossrock',        elemento: 'terra',    rarita: 'non_comune', descrizione: 'Golem di pietra ricoperto da muschio millenario.', potere: 37 },
  { id: 'kj_042', numero: 42, nome: 'Wraithnar',       elemento: 'ombra',    rarita: 'non_comune', descrizione: 'Spettro antico legato ai rovine dimenticate.', potere: 43 },
  { id: 'kj_043', numero: 43, nome: 'Stormfang',       elemento: 'fulmine',  rarita: 'non_comune', descrizione: 'Lupo delle tempeste che corre tra i fulmini.', potere: 41 },
  { id: 'kj_044', numero: 44, nome: 'Permafex',        elemento: 'ghiaccio', rarita: 'non_comune', descrizione: 'Gigante di permafrost che non conosce il caldo.', potere: 38 },
  { id: 'kj_045', numero: 45, nome: 'Scalewing',       elemento: 'drago',    rarita: 'non_comune', descrizione: 'Drago alato dalla scaglie iridescenti dorate.', potere: 46 },
  { id: 'kj_046', numero: 46, nome: 'Aurorex',         elemento: 'luce',     rarita: 'non_comune', descrizione: 'Manifestazione dell\'aurora boreale in forma vivente.', potere: 35 },
  { id: 'kj_047', numero: 47, nome: 'Crestfire',       elemento: 'fuoco',    rarita: 'non_comune', descrizione: 'Cavaliere del fuoco che sorveglia i confini del vulcano.', potere: 40 },

  // ── RARE (8) ──────────────────────────────────────────────────────────────
  { id: 'kj_048', numero: 48, nome: 'Solarius Rex',    elemento: 'luce',     rarita: 'raro',       descrizione: 'Signore della luce primordiale. Antico quanto le stelle.', potere: 90 },
  { id: 'kj_049', numero: 49, nome: 'Infernax Omega',  elemento: 'fuoco',    rarita: 'raro',       descrizione: 'Il fuoco cosmico che arse prima della creazione del mondo.', potere: 95 },
  { id: 'kj_050', numero: 50, nome: 'Abyssal Titan',   elemento: 'acqua',    rarita: 'raro',       descrizione: 'Colossale entità degli abissi. Nessun sonar l\'ha mai rilevato.', potere: 88 },
  { id: 'kj_051', numero: 51, nome: 'Terramorphus',    elemento: 'terra',    rarita: 'raro',       descrizione: 'Il continente vivente. Dove cammina, nasce una montagna.', potere: 92 },
  { id: 'kj_052', numero: 52, nome: 'Void Empress',    elemento: 'ombra',    rarita: 'raro',       descrizione: 'Regina dell\'oscurità assoluta. Il vuoto obbedisce al suo volere.', potere: 98 },
  { id: 'kj_053', numero: 53, nome: 'Thunderlord',     elemento: 'fulmine',  rarita: 'raro',       descrizione: 'Signore dei fulmini. Con un cenno, chiama la tempesta.', potere: 100 },
  { id: 'kj_054', numero: 54, nome: 'Glacial Sovereign',elemento: 'ghiaccio',rarita: 'raro',       descrizione: 'Sovrano eterno del ghiaccio. Il suo respiro congela il tempo.', potere: 85 },
  { id: 'kj_055', numero: 55, nome: 'Kudjo Drakon',    elemento: 'drago',    rarita: 'raro',       descrizione: 'Il drago leggendario di Kudjo. Esiste una sola copia nell\'universo.', potere: 120 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

const comuniPool  = kudjoCards.filter(c => c.rarita === 'comune');
const ncPool      = kudjoCards.filter(c => c.rarita === 'non_comune');
const raroPool    = kudjoCards.filter(c => c.rarita === 'raro');

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Draws 5 cards for a single booster pack using the weighted slot system:
 * - Slot 1–3: always Comune
 * - Slot 4: 70% Comune, 30% Non Comune
 * - Slot 5: 50% Comune, 35% Non Comune, 15% Raro
 */
export function drawPackCards(): KudjoCard[] {
  const cards: KudjoCard[] = [];

  // Slots 1-3: Comune
  for (let i = 0; i < 3; i++) cards.push(randomFrom(comuniPool));

  // Slot 4
  const roll4 = Math.random();
  cards.push(roll4 < 0.70 ? randomFrom(comuniPool) : randomFrom(ncPool));

  // Slot 5
  const roll5 = Math.random();
  if (roll5 < 0.50) cards.push(randomFrom(comuniPool));
  else if (roll5 < 0.85) cards.push(randomFrom(ncPool));
  else cards.push(randomFrom(raroPool));

  return cards;
}

/**
 * Draws n packs worth of cards (5 cards each).
 */
export function drawMultiplePacks(n: number): KudjoCard[][] {
  return Array.from({ length: n }, () => drawPackCards());
}

export function getCardById(id: string): KudjoCard | undefined {
  return kudjoCards.find(c => c.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage persistence
// ─────────────────────────────────────────────────────────────────────────────

const COLLECTION_KEY = 'kudjo_digital_collection';
const PACKS_KEY      = 'kudjo_pending_packs';

export function getUserCollection(): KudjoCardInstance[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    return raw ? (JSON.parse(raw) as KudjoCardInstance[]) : [];
  } catch {
    return [];
  }
}

export function addCardsToCollection(cards: KudjoCard[], packTier: string): void {
  if (typeof window === 'undefined') return;
  const existing = getUserCollection();
  const now = new Date().toISOString();
  const newInstances: KudjoCardInstance[] = cards.map(c => ({
    cardId: c.id,
    foundAt: now,
    packTier,
  }));
  localStorage.setItem(COLLECTION_KEY, JSON.stringify([...existing, ...newInstances]));
}

export function clearCollection(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COLLECTION_KEY);
}

// ── Pending packs (purchased but not yet opened) ──────────────────────────

export function getPendingPacks(): KudjoPendingPack[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PACKS_KEY);
    return raw ? (JSON.parse(raw) as KudjoPendingPack[]) : [];
  } catch {
    return [];
  }
}

export function addPendingPacks(tier: string, quantity: number): void {
  if (typeof window === 'undefined') return;
  const existing = getPendingPacks();
  const idx = existing.findIndex(p => p.tier === tier);
  if (idx >= 0) {
    existing[idx].quantity += quantity;
  } else {
    existing.push({ tier, quantity });
  }
  localStorage.setItem(PACKS_KEY, JSON.stringify(existing));
}

export function consumeOnePack(tier: string): boolean {
  if (typeof window === 'undefined') return false;
  const existing = getPendingPacks();
  const idx = existing.findIndex(p => p.tier === tier);
  if (idx < 0 || existing[idx].quantity <= 0) return false;
  existing[idx].quantity -= 1;
  if (existing[idx].quantity === 0) existing.splice(idx, 1);
  localStorage.setItem(PACKS_KEY, JSON.stringify(existing));
  return true;
}

export function getTotalPendingPacks(): number {
  return getPendingPacks().reduce((sum, p) => sum + p.quantity, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestones
// ─────────────────────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  threshold: number; // unique cards needed
  labelIt: string;
  labelEn: string;
  rewardIt: string;
  rewardEn: string;
  emoji: string;
}

export const MILESTONES: Milestone[] = [
  { id: 'm_5',  threshold: 5,  emoji: '🌱', labelIt: 'Apprendista',       labelEn: 'Apprentice',      rewardIt: 'Sconto 5% sul prossimo ordine',           rewardEn: '5% off your next order' },
  { id: 'm_10', threshold: 10, emoji: '⚡', labelIt: 'Collezionista',      labelEn: 'Collector',       rewardIt: 'Sconto 10% su carte singole',             rewardEn: '10% off single cards' },
  { id: 'm_20', threshold: 20, emoji: '🔥', labelIt: 'Cacciatore di Rare', labelEn: 'Rare Hunter',     rewardIt: 'Spedizione gratuita sul prossimo ordine', rewardEn: 'Free shipping on next order' },
  { id: 'm_35', threshold: 35, emoji: '🌊', labelIt: 'Maestro del Set',    labelEn: 'Set Master',      rewardIt: 'Codice sconto 15% esclusivo',             rewardEn: 'Exclusive 15% discount code' },
  { id: 'm_47', threshold: 47, emoji: '🐉', labelIt: 'Dominatore',         labelEn: 'Dominator',       rewardIt: 'Accesso anticipato alle nuove uscite',    rewardEn: 'Early access to new releases' },
  { id: 'm_55', threshold: 55, emoji: '👑', labelIt: 'Campione Kudjo',     labelEn: 'Kudjo Champion',  rewardIt: 'Mystery Box fisica in omaggio',           rewardEn: 'Free physical Mystery Box' },
];
