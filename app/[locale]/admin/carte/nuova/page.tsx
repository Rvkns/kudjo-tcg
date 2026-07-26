'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';
import Image from 'next/image';
import KudjoCard from '@/app/components/KudjoCard';
import { KudjoCardElemento } from '@/lib/schema/kudjo-card';


export default function AdminNuovaCartaPage() {
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Card Type Selector: 'reale' (Store/Collezione with Price & Photos) vs 'digitale' (TCG Pack Card)
  const [cardType, setCardType] = useState<'reale' | 'digitale'>('reale');

  // Common & Real Marketplace Card Fields
  const [nome, setNome] = useState('');
  const [prezzo, setPrezzo] = useState<number | string>(150);
  const [gioco, setGioco] = useState('pokemon');
  const [cardSetNome, setCardSetNome] = useState('Scarlet & Violet 151');
  const [condizioneRaw, setCondizioneRaw] = useState('NM');
  const [gradata, setGradata] = useState(true);
  const [gradingCompany, setGradingCompany] = useState('PSA');
  const [voto, setVoto] = useState('10');
  const [fotoFronte, setFotoFronte] = useState('');
  const [fotoAngolata, setFotoAngolata] = useState('');
  const [fotoRetro, setFotoRetro] = useState('');
  const [statoVendita, setStatoVendita] = useState('disponibile');
  const [notaStoria, setNotaStoria] = useState('');

  // Digital TCG Card Fields
  const [numeroDigitale, setNumeroDigitale] = useState(56);
  const [elementoDigitale, setElementoDigitale] = useState('Fuoco');
  const [raritaDigitale, setRaritaDigitale] = useState<'comune' | 'non_comune' | 'raro'>('comune');
  const [potereDigitale, setPotereDigitale] = useState(500);

  useEffect(() => {
    const init = async () => {
      const admin = await verifyAdminAccess();
      if (!admin) {
        router.replace('/');
        return;
      }
      setToken(admin.token);
      setLoading(false);
    };
    init();
  }, [locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim()) {
      setErrorMsg('Inserisci il nome della carta.');
      return;
    }

    setSaving(true);

    try {
      if (cardType === 'reale') {
        // Submit Real Marketplace Card for Store/Collezione
        const priceNum = Number(prezzo);
        if (isNaN(priceNum) || priceNum < 0) {
          setErrorMsg('Inserisci un prezzo valido in Euro.');
          setSaving(false);
          return;
        }

        const fotoArray = [fotoFronte.trim(), fotoAngolata.trim(), fotoRetro.trim()].filter(Boolean);

        const res = await fetch('/api/admin/marketplace-items', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome,
            gioco,
            set_nome: cardSetNome,
            prezzo: priceNum,
            condizione_raw: condizioneRaw,
            gradata,
            grading_company: gradata ? gradingCompany : null,
            voto: gradata ? voto : null,
            foto: fotoArray.length > 0 ? fotoArray : ['/images/cards/placeholder_front.jpg'],
            stato: statoVendita,
            nota_storia: notaStoria,
          }),
        });

        const json = await res.json();
        setSaving(false);

        if (json.error) {
          setErrorMsg(json.error);
          return;
        }
      } else {
        // Submit Digital TCG Pack Card
        const res = await fetch('/api/admin/cards', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            numero: numeroDigitale,
            nome,
            elemento: elementoDigitale,
            rarita: raritaDigitale,
            potere: potereDigitale,
            descrizione: notaStoria,
            immagine_url: fotoFronte || undefined,
          }),
        });

        const json = await res.json();
        setSaving(false);

        if (json.error) {
          setErrorMsg(json.error);
          return;
        }
      }

      router.push('/admin/carte');
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Errore durante il salvataggio della carta.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">â† Sito</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin/carte" className="text-neutral-400 hover:text-white transition-colors">Carte TCG</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold">Nuova Carta</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Inserisci Nuova <span className="text-cyan-400 font-semibold">Carta TCG</span>
          </h1>
          <p className="text-neutral-500 text-sm">Scegli la tipologia di carta da creare (Carta Reale in vendita nello Store o Carta Busta Digitale).</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{errorMsg}</div>
        )}

        {/* Type Selector Tabs */}
        <div className="flex border-b border-white/10 mb-8 bg-white/[0.02] p-1.5 rounded-xl border">
          <button
            type="button"
            onClick={() => setCardType('reale')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              cardType === 'reale'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>ðŸ’Ž</span> Carta Reale in Vendita (Prezzo â‚¬ & Foto Reali)
          </button>
          <button
            type="button"
            onClick={() => setCardType('digitale')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              cardType === 'digitale'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>ðŸƒ</span> Carta Busta Digitale Kudjo TCG
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
            
            {/* TYPE 1: REAL MARKETPLACE CARD FOR STORE */}
            {cardType === 'reale' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-amber-400 font-bold mb-2">
                      Prezzo di Vendita (â‚¬) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prezzo}
                      onChange={(e) => setPrezzo(e.target.value)}
                      placeholder="Es. 150.00"
                      className="w-full bg-[#111] border border-amber-500/40 rounded-lg px-4 py-2.5 text-base text-white font-extrabold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Nome Carta Reale *
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Es. Charizard ex SAR / Portgas D. Ace Manga"
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Gioco / TCG *
                    </label>
                    <select
                      value={gioco}
                      onChange={(e) => setGioco(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="pokemon">PokÃ©mon TCG</option>
                      <option value="one_piece">One Piece TCG</option>
                      <option value="kudjo">Kudjo TCG Original</option>
                      <option value="yugioh">Yu-Gi-Oh!</option>
                      <option value="magic">Magic: The Gathering</option>
                      <option value="lorcana">Disney Lorcana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Set / Edizione *
                    </label>
                    <input
                      type="text"
                      value={cardSetNome}
                      onChange={(e) => setCardSetNome(e.target.value)}
                      placeholder="Es. Scarlet & Violet 151 / OP-05"
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                {/* Grading / Condition Fields */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                      <input
                        type="checkbox"
                        checked={gradata}
                        onChange={(e) => setGradata(e.target.checked)}
                        className="w-4 h-4 rounded bg-neutral-900 border-white/20 text-amber-500 focus:ring-0"
                      />
                      <span>Carta Gradata Ufficialmente (PSA / BGS / CGC)</span>
                    </label>
                  </div>

                  {gradata ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                          Ente di Gradazione
                        </label>
                        <select
                          value={gradingCompany}
                          onChange={(e) => setGradingCompany(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        >
                          <option value="PSA">PSA</option>
                          <option value="BGS">Beckett (BGS)</option>
                          <option value="CGC">CGC</option>
                          <option value="GRAAD">GRAAD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                          Voto Assegnato
                        </label>
                        <select
                          value={voto}
                          onChange={(e) => setVoto(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        >
                          <option value="10">10 (Gem Mint)</option>
                          <option value="9.5">9.5 (Gem Mint BGS)</option>
                          <option value="9">9 (Mint)</option>
                          <option value="8.5">8.5 (Near Mint-Mint)</option>
                          <option value="8">8 (Near Mint-Mint)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                        Condizione Raw
                      </label>
                      <select
                        value={condizioneRaw}
                        onChange={(e) => setCondizioneRaw(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <option value="NM">Near Mint (NM)</option>
                        <option value="EX">Excellent (EX)</option>
                        <option value="LP">Lightly Played (LP)</option>
                        <option value="PL">Played (PL)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Image Photos URLs */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                    Foto della Carta Reale (Fronte, Angolata, Retro)
                  </label>
                  <input
                    type="text"
                    value={fotoFronte}
                    onChange={(e) => setFotoFronte(e.target.value)}
                    placeholder="URL Foto Fronte (es. /images/cards/charizard_front.svg o link Supabase)"
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <input
                    type="text"
                    value={fotoAngolata}
                    onChange={(e) => setFotoAngolata(e.target.value)}
                    placeholder="URL Foto Angolata (Opzionale per effetto Holo)"
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <input
                    type="text"
                    value={fotoRetro}
                    onChange={(e) => setFotoRetro(e.target.value)}
                    placeholder="URL Foto Retro (Opzionale)"
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                      Stato DisponibilitÃ  Store
                    </label>
                    <select
                      value={statoVendita}
                      onChange={(e) => setStatoVendita(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="disponibile">ðŸŸ¢ Disponibile per la vendita</option>
                      <option value="in_trattativa">ðŸŸ¡ In trattativa</option>
                      <option value="venduta">ðŸ”´ Venduta (Archivio)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                    Storia & Note del Pezzo da Collezione
                  </label>
                  <textarea
                    rows={3}
                    value={notaStoria}
                    onChange={(e) => setNotaStoria(e.target.value)}
                    placeholder="Note sulla gradazione, provenienza o storia del pezzo da collezione..."
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </>
            ) : (
              /* TYPE 2: DIGITAL TCG PACK CARD */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Numero Carta Digitale *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numeroDigitale}
                      onChange={(e) => setNumeroDigitale(Number(e.target.value))}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Nome Carta Digitale *
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Es. Drago di Luce Eterna"
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Elemento *
                    </label>
                    <select
                      value={elementoDigitale}
                      onChange={(e) => setElementoDigitale(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="Fuoco">ðŸ”¥ Fuoco</option>
                      <option value="Acqua">ðŸ’§ Acqua</option>
                      <option value="Terra">ðŸª¨ Terra</option>
                      <option value="Ombra">ðŸŒ‘ Ombra</option>
                      <option value="Fulmine">âš¡ Fulmine</option>
                      <option value="Ghiaccio">â„ï¸ Ghiaccio</option>
                      <option value="Drago">ðŸ‰ Drago</option>
                      <option value="Luce">âœ¨ Luce</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      RaritÃ  *
                    </label>
                    <select
                      value={raritaDigitale}
                      onChange={(e) => setRaritaDigitale(e.target.value as 'comune' | 'non_comune' | 'raro')}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="comune">Comune (C)</option>
                      <option value="non_comune">Non Comune (NC)</option>
                      <option value="raro">Raro (R)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      Potere (PWR) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={potereDigitale}
                      onChange={(e) => setPotereDigitale(Number(e.target.value))}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                    URL Immagine Copertina (Opzionale)
                  </label>
                  <input
                    type="text"
                    value={fotoFronte}
                    onChange={(e) => setFotoFronte(e.target.value)}
                    placeholder="URL immagine personalizzata"
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                    Descrizione Carta (Opzionale)
                  </label>
                  <textarea
                    rows={3}
                    value={notaStoria}
                    onChange={(e) => setNotaStoria(e.target.value)}
                    placeholder="Descrizione dettagliata della storia o abilitÃ  della carta..."
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
              <Link
                href="/admin/carte"
                className="text-xs text-neutral-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Annulla
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider px-8 py-3 rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : cardType === 'reale' ? 'Pubblica Carta in Vendita' : 'Crea Carta TCG'}
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Anteprima Scheda Prodotto</div>
            <div className="bg-white/[0.02] border border-amber-500/30 rounded-xl p-4 space-y-3 flex flex-col items-center">
              {cardType === 'reale' ? (
                <div className="w-full space-y-3">
                  <div className="relative aspect-[3/4] w-full rounded-lg bg-neutral-900 overflow-hidden border border-white/10">
                    <Image
                      src={fotoFronte || '/images/cards/charizard_front.svg'}
                      alt={nome || 'Carta'}
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                    {gradata && (
                      <span className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                        {gradingCompany} {voto}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{nome || 'Nome Carta Reale'}</h3>
                    <div className="text-xs text-neutral-400 mt-0.5">{cardSetNome} ({gioco.toUpperCase()})</div>
                    <div className="text-lg font-extrabold text-amber-400 mt-2">â‚¬{prezzo}</div>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-3 flex flex-col items-center">
                  <KudjoCard
                    card={{
                      id: `kj_${String(numeroDigitale).padStart(3, '0')}`,
                      numero: numeroDigitale,
                      nome: nome || 'Nuova Carta',
                      elemento: (elementoDigitale.toLowerCase() as KudjoCardElemento) || 'fuoco',
                      rarita: raritaDigitale,
                      descrizione: notaStoria || '',
                      potere: potereDigitale,
                    }}
                    size="normal"
                    disableZoom
                  />
                  <div className="w-full">
                    <h3 className="text-sm font-bold text-white">{nome || 'Nome Carta'}</h3>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-neutral-400">{elementoDigitale}</span>
                      <span className="font-mono text-cyan-400 font-bold">PWR: {potereDigitale}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
