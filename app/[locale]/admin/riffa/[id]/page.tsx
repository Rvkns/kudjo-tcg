'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';


interface Concorso {
  id: string;
  nome: string;
  stato: 'draft' | 'attivo' | 'concluso';
  created_at: string;
}

interface TicketRow {
  user_id: string;
  quantity: number;
  user: {
    email: string;
    full_name: string;
  };
}

interface Winner {
  id: string;
  user_id: string;
  ticket_count: number;
  prize: string;
  draw_index: number;
  drawn_at: string;
  user: {
    email: string;
    full_name: string;
  };
}

type Params = Promise<{ id: string }>;

export default function ConcorsoRaffleDetailPage(props: { params: Params }) {
  const { id } = use(props.params);
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [concorso, setConcorso] = useState<Concorso | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);

  // Prizes state
  const [prizes, setPrizes] = useState<string[]>([
    '1Â° Premio: Kudjo Mystery Box Premium',
    '2Â° Premio: Booster Box PokÃ©mon / One Piece TCG',
    '3Â° Premio: Special Art Foil Single Card'
  ]);

  // Drawing animation states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawIndex, setCurrentDrawIndex] = useState(-1);
  const [rollingName, setRollingName] = useState('');
  const [drawnRevealList, setDrawnRevealList] = useState<Winner[]>([]);

  const fetchDetails = useCallback(async (tok: string) => {
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/riffa/${id}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
        return;
      }
      setConcorso(json.concorso);
      setTickets(json.tickets ?? []);
      setWinners(json.winners ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Errore nel recupero dei dettagli del concorso.');
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      const admin = await verifyAdminAccess();
      if (!admin) {
        router.replace('/');
        return;
      }
      const tok = admin.token;
      setToken(tok);
      setIsAdmin(true);
      await fetchDetails(tok);
      setLoading(false);
    };
    init();
  }, [locale, router, fetchDetails]);

  const handleAddPrizeInput = () => {
    setPrizes([...prizes, `Premio #${prizes.length + 1}`]);
  };

  const handleRemovePrizeInput = (idx: number) => {
    if (prizes.length === 1) {
      alert('Devi specificare almeno un premio.');
      return;
    }
    setPrizes(prizes.filter((_, i) => i !== idx));
  };

  const handlePrizeTextChange = (idx: number, text: string) => {
    const updated = [...prizes];
    updated[idx] = text;
    setPrizes(updated);
  };

  // Run the drawing with premium rolling animations
  const handleExecuteDraw = async () => {
    if (tickets.length === 0) {
      alert('Non ci sono partecipanti con ticket in questo concorso.');
      return;
    }
    const cleanPrizes = prizes.map(p => p.trim()).filter(p => p !== '');
    if (cleanPrizes.length === 0) {
      alert('Inserisci almeno un nome di premio valido.');
      return;
    }

    if (!confirm('Sei pronto ad avviare l\'estrazione ufficiale dei vincitori?\n\nL\'operazione salverÃ  i risultati nel database.')) {
      return;
    }

    setIsDrawing(true);
    setDrawnRevealList([]);
    setCurrentDrawIndex(0);

    try {
      const res = await fetch(`/api/admin/riffa/${id}/draw`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prizes: cleanPrizes })
      });
      const json = await res.json();

      if (json.error) {
        alert(json.error);
        setIsDrawing(false);
        return;
      }

      const finalWinners: Winner[] = json.winners;

      // Animate the reveal one-by-one
      let pIdx = 0;
      const animateNextPrize = () => {
        if (pIdx >= finalWinners.length) {
          // Completed draw animation
          setIsDrawing(false);
          setCurrentDrawIndex(-1);
          setWinners(finalWinners);
          return;
        }

        setCurrentDrawIndex(pIdx);
        let rollCounter = 0;
        
        // Rapidly shuffle names for suspense
        const interval = setInterval(() => {
          const randTicket = tickets[Math.floor(Math.random() * tickets.length)];
          const displayName = randTicket.user.full_name || randTicket.user.email;
          setRollingName(displayName);
          rollCounter++;

          if (rollCounter > 15) {
            clearInterval(interval);
            // Reveal real winner
            const realWinner = finalWinners[pIdx];
            setDrawnRevealList(prev => [...prev, realWinner]);
            pIdx++;
            setTimeout(animateNextPrize, 1200); // Wait 1.2s before drawing next prize
          }
        }, 80);
      };

      animateNextPrize();

    } catch (err: unknown) {
      setIsDrawing(false);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore di connessione: ${msg}`);
    }
  };

  const handleResetDraw = async () => {
    if (!confirm('ATTENZIONE: Sei sicuro di voler annullare l\'estrazione?\n\nQuesto eliminerÃ  in modo permanente l\'elenco dei vincitori per questo concorso, permettendoti di effettuare un nuovo sorteggio.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/riffa/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.error) {
        alert(`Errore: ${json.error}`);
        return;
      }

      await fetchDetails(token);
      setDrawnRevealList([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Errore: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento estrazione...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] text-white font-sans flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-6 max-w-md text-center">
          <p className="text-sm font-semibold mb-4">{errorMsg}</p>
          <Link href="/admin/riffa" className="text-xs bg-white text-black px-4 py-2 rounded font-bold uppercase tracking-wider">
            Torna alle Riffe
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin || !concorso) return null;

  const totalTickets = tickets.reduce((s, t) => s + t.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">â† Sito</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin/riffa" className="text-neutral-400 hover:text-white transition-colors">Ticket & Riffa</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold truncate max-w-[200px]">{concorso.nome}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="border-b border-white/5 pb-8 mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-white mb-2">
              Gestione Estrazione: <span className="text-red-400 font-semibold">{concorso.nome}</span>
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Configura i premi da estrarre ed effettua il sorteggio basato sulla quantitÃ  di ticket accumulati dagli utenti.
            </p>
          </div>
          <div className="text-neutral-500 text-xs md:text-right">
            <span className="text-neutral-600">Stato Concorso:</span>
            <span className="ml-1.5 uppercase font-bold text-white tracking-widest">{concorso.stato}</span>
          </div>
        </div>

        {/* 1. ANIMATION DRAWING PANEL */}
        {isDrawing && (
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-8 mb-8 text-center space-y-6 animate-pulse">
            <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-[10px] font-bold tracking-widest uppercase">
              âš¡ Estrazione in corso...
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-neutral-500 uppercase tracking-widest">Premio Corrente</div>
              <div className="text-xl md:text-2xl font-semibold text-white">{prizes[currentDrawIndex]}</div>
            </div>

            <div className="h-20 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl max-w-md mx-auto">
              <span className="text-2xl md:text-3xl font-bold tracking-wide text-red-400 font-mono">
                {rollingName}
              </span>
            </div>

            {/* List of winners revealed so far */}
            {drawnRevealList.length > 0 && (
              <div className="max-w-md mx-auto text-left border-t border-white/5 pt-4 space-y-2.5">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Vincitori Estratti:</div>
                {drawnRevealList.map((w, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-white/[0.02] border border-white/5 rounded p-2.5">
                    <span className="text-neutral-400">{w.prize}</span>
                    <strong className="text-emerald-400">{w.user.full_name || w.user.email}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: DRAWING FORM OR WINNERS LIST */}
          <div className="lg:col-span-2 space-y-6">
            {winners.length > 0 && !isDrawing ? (
              /* ALREADY DRAWN STATE: SHOW WINNERS */
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>ðŸ†</span> Vincitori Ufficiali
                  </h2>
                  <button
                    onClick={handleResetDraw}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    ðŸ”„ Resetta Sorteggio
                  </button>
                </div>

                <div className="space-y-4">
                  {winners.map((w, idx) => (
                    <div
                      key={w.id}
                      className="relative flex items-center justify-between p-5 border border-white/5 bg-gradient-to-r from-red-950/10 to-transparent rounded-xl"
                    >
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">{w.prize}</div>
                        <div className="text-base font-bold text-white flex items-center gap-2">
                          <span>ðŸ‘¤</span> {w.user.full_name || 'â€”'}
                        </div>
                        <div className="text-xs text-neutral-400">{w.user.email}</div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Ticket Posseduti</div>
                        <div className="text-sm font-semibold text-red-400">{w.ticket_count} ticket</div>
                        <div className="text-[9px] text-neutral-600">
                          ProbabilitÃ : {totalTickets > 0 ? ((w.ticket_count / totalTickets) * 100).toFixed(1) : 0}%
                        </div>
                      </div>

                      {/* Rank badge */}
                      <div className="absolute -left-2.5 -top-2.5 w-6 h-6 rounded-full bg-red-600 border border-[#0b0b0c] text-[10px] font-bold flex items-center justify-center text-white">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* NOT DRAWN STATE: SHOW CONFIGURATION FORM */
              !isDrawing && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <span>âš™ï¸</span> Configura Premi Riffa
                  </h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Aggiungi l&apos;elenco dei premi finali in ordine di estrazione. Il sorteggio finale assegnerÃ  ciascun premio a un utente estratto casualmente in modo ponderato (piÃ¹ ticket equivalgono a maggiore probabilitÃ ). Ciascun utente puÃ² vincere un solo premio.
                  </p>

                  <div className="space-y-3">
                    {prizes.map((prize, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <span className="text-xs font-mono text-neutral-600 w-8 text-right">{idx + 1}.</span>
                        <input
                          type="text"
                          value={prize}
                          onChange={(e) => handlePrizeTextChange(idx, e.target.value)}
                          placeholder={`es. Premio #${idx + 1}`}
                          className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePrizeInput(idx)}
                          className="text-neutral-500 hover:text-red-400 text-xs px-2 py-1 transition-colors cursor-pointer"
                        >
                          Elimina
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPrizeInput}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 pt-1 cursor-pointer"
                  >
                    âž• Aggiungi Premio
                  </button>

                  <div className="border-t border-white/5 pt-6 bg-transparent">
                    <button
                      onClick={handleExecuteDraw}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.35)] transition-all cursor-pointer"
                    >
                      ðŸŽ² Avvia Estrazione Ufficiale
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* RIGHT: TICKET DISTRIBUTION LIST */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Distribuzione Ticket ({tickets.length} utenti)
              </h3>
              
              {tickets.length === 0 ? (
                <p className="text-xs text-neutral-500 italic">Nessun ticket distribuito in questo concorso.</p>
              ) : (
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {tickets.map((tRow) => {
                    const prob = totalTickets > 0 ? ((tRow.quantity / totalTickets) * 100).toFixed(1) : '0';
                    return (
                      <div key={tRow.user_id} className="text-xs flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="truncate max-w-[160px]">
                          <div className="font-semibold text-neutral-200 truncate">{tRow.user.full_name || 'â€”'}</div>
                          <div className="text-[10px] text-neutral-500 truncate">{tRow.user.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-400">{tRow.quantity} ticket</div>
                          <div className="text-[9px] text-neutral-600">ProbabilitÃ : {prob}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
