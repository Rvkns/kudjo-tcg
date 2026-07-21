'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface WikiSection {
  id: string;
  category: string;
  icon: string;
  title: string;
  badge: string;
  description: string;
  quickLink: string;
  quickLinkText: string;
  steps: { title: string; detail: string; code?: string }[];
  importantNotes?: string[];
}

export default function AdminWikiPage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('panoramica');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() ?? '';
      if (!ADMIN_EMAILS.includes(email)) {
        router.replace('/');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };
    init();
  }, [locale, router]);

  const wikiSections: WikiSection[] = [
    {
      id: 'panoramica',
      category: 'Generale',
      icon: '🏰',
      title: 'Panoramica & Permessi Admin',
      badge: 'Architettura & Accesso',
      description: 'Spiegazione del pannello amministrativo Kudjo, ruoli e permessi di sicurezza.',
      quickLink: '/admin',
      quickLinkText: 'Vai alla Dashboard Admin',
      steps: [
        {
          title: 'Accesso Riservato Admin',
          detail: 'L\'accesso al pannello /admin è protetto da Middleware ed invoca la verifica dell\'email Supabase Auth. Solo le email autorizzate (kudjotcg@gmail.com, sentz01@gmail.com) possono visualizzare e modificare le risorse gestionali.',
        },
        {
          title: 'Struttura Moduli',
          detail: 'La piattaforma Kudjo è suddivisa in 7 aree amministrative principali: Analytics, Carte & Pacchetti, Concorsi, Sondaggi, Collection Sets, Ticket & Riffa, e Sconti Utenti.',
        },
      ],
      importantNotes: [
        'Qualsiasi modifica apportata ai pacchetti o alle carte si riflette in tempo reale sia nel checkout Stripe che nello store pubblico.',
      ],
    },
    {
      id: 'carte',
      category: 'Prodotti & Store',
      icon: '💎',
      title: 'Gestione Carte Reali, Kudjo TCG & Prezzi Buste',
      badge: 'Store & Catalogo',
      description: 'Come inserire carte reali da vendere nello store, carte del gioco digitale Kudjo TCG e modificare i prezzi delle buste.',
      quickLink: '/admin/carte',
      quickLinkText: 'Gestisci Carte & Pacchetti',
      steps: [
        {
          title: 'Inserire una Carta Reale in Vendita nello Store (/collezione)',
          detail: 'Nel form "Nuova Carta", seleziona il tab "💎 Carta Reale in Vendita". Inserisci il Prezzo di Vendita in € (es. 150.00), il Nome della carta (es. Charizard ex SAR), il Gioco TCG (Pokémon, One Piece, Yu-Gi-Oh!, Kudjo), il Set/Edizione, lo stato di Gradazione (PSA 10, BGS 9.5 o Raw NM) e le foto ad alta risoluzione (Fronte, Angolata, Retro). La carta apparirà immediatamente nella Collezione pubblica.',
        },
        {
          title: 'Inserire una Carta Busta Digitale Kudjo TCG',
          detail: 'Nel form "Nuova Carta", seleziona "🃏 Carta Busta Digitale". Inserisci il Numero di raccolta (#1..#55), l\'Elemento (Fuoco, Acqua, Terra, Ombra, Fulmine, Ghiaccio, Drago, Luce), la Rarità (Comune, Non Comune, Raro) ed il Potere PWR (es. 500). Se non viene fornito un URL foto custom, il gioco utilizzerà automaticamente la grafica olografica procedurale Kudjo TCG.',
        },
        {
          title: 'Modificare Prezzo & Contenuto dei 4 Pacchetti Buste',
          detail: 'Nel tab "📦 Prezzi Pacchetti", seleziona uno dei 4 Tier (Busta Rame, Argento, Oro, Platino). Puoi modificare il prezzo in Euro, il numero di carte erogate per busta ed il numero di Ticket Riffa inclusi omaggio. I nuovi prezzi aggiornano istantaneamente le sessioni Stripe Checkout & PayPal.',
        },
      ],
      importantNotes: [
        'Ricorda: Le carte reali in vendita nello store richiedono obbligatoriamente un prezzo in € e la foto del pezzo fisico.',
      ],
    },
    {
      id: 'analytics',
      category: 'Statistiche',
      icon: '📈',
      title: 'Analytics & KPI Dashboard Executive',
      badge: 'Metriche & Insight',
      description: 'Analisi dettagliata di fatturato, scontrino medio, buste acquistate per orario, pull rate e feedback utenti.',
      quickLink: '/admin/analytics',
      quickLinkText: 'Apri Executive Analytics',
      steps: [
        {
          title: 'KPI Summary Cards',
          detail: 'Visualizza in tempo reale il Fatturato Totale (€), il totale Buste Vendute, il totale Utenti Registrati, le Carte Sbustate ed il totale Ticket Riffa in circolazione.',
        },
        {
          title: 'Heatmap Orario delle Vendite (24h)',
          detail: 'Grafico a barre interattivo per individuare in quali fasce orarie della giornata gli utenti acquistano più buste digitali.',
        },
        {
          title: 'Analisi Carte più Sbustate vs più Rare',
          detail: 'Ranking delle carte che escono di più durante le aperture ed i relativi tassi di rarità e distribuzione per elemento.',
        },
        {
          title: 'Analisi Sondaggi & Feedback Community',
          detail: 'Sezione integrata che aggrega le risposte dei sondaggi attivi con il link diretto ai report dettagliati.',
        },
      ],
    },
    {
      id: 'concorsi',
      category: 'Gioco & Concorsi',
      icon: '🏆',
      title: 'Concorsi, Reset Carte & Estrazione Riffa',
      badge: 'Regolamento & Sorteggio',
      description: 'Come gestire i concorsi a premi temporizzati, il reset automatico ed il sorteggio con peso probabilistico.',
      quickLink: '/admin/concorsi',
      quickLinkText: 'Gestisci Concorsi',
      steps: [
        {
          title: 'Creazione e Durata Concorso',
          detail: 'Ogni concorso ha una data di inizio ed una data di fine. Gli utenti accumulano carte Kudjo TCG e Ticket Riffa acquistando i pacchetti durante il periodo del concorso.',
        },
        {
          title: 'Regola Fondamentale Reset Concorso',
          detail: 'Al termine di un concorso (o tramite il reset admin), le carte digitali collezionate dagli utenti per quel concorso vengono riportate a 0 per permettere a tutti di ripartire ad armi pari nel nuovo concorso. GLI SCONTI ACQUISITI E REGISTRATI NELL\'ACCOUNT UTENTE NON VENGONO MAI RESETTATI E RIMANGONO PERMANENTI.',
        },
        {
          title: 'Estrazione Riffa / Sorteggio Finale (/admin/riffa)',
          detail: 'Nel pannello /admin/riffa/[id], l\'admin può avviare il sorteggio automatico con il pulsante "Esegui Estrazione". L\'algoritmo utilizza una selezione casuale ponderata (weighted random selection) dove ciascun ticket posseduto dall\'utente rappresenta 1 chance di vittoria. Il vincitore viene salvato ed esposto pubblicamente nella pagina /concorso.',
        },
      ],
      importantNotes: [
        'CAUTION: Eseguire il Reset Concorso azzera la collezione carte di quel ciclo. Gli sconti legati agli account restano invece preservati per sempre.',
      ],
    },
    {
      id: 'collection_sets',
      category: 'Gamification',
      icon: '🎴',
      title: 'Collection Sets & Sblocchi Ricompense',
      badge: 'Progresso Utenti',
      description: 'Creazione di set di carte tematici che gli utenti devono completare per sbloccare codici sconto esclusivi.',
      quickLink: '/admin/collection-sets',
      quickLinkText: 'Gestisci Collection Sets',
      steps: [
        {
          title: 'Creazione Nuovo Collection Set',
          detail: 'Definisci un titolo (es. "Master Set Elemento Fuoco"), una descrizione ed una percentuale o valore di sconto (es. 20% di sconto o Codice Sconto "KUDJO20").',
        },
        {
          title: 'Selettore Carte del Set',
          detail: 'Seleziona quali carte tra le 55 del Kudjo TCG sono necessarie per completare il set.',
        },
        {
          title: 'Riscatto Automatico Lato Utente',
          detail: 'Quando l\'utente completa la collezione nel suo profilo (/profilo), il sistema verifica il possesso delle carte e genera un codice sconto unico registrato nella tabella user_discounts.',
        },
      ],
    },
    {
      id: 'sconti',
      category: 'Promozioni',
      icon: '💸',
      title: 'Sconti Utenti & Assegnazioni Manuali',
      badge: 'Fidelizzazione',
      description: 'Pannello per monitorare gli sconti attivi e regalare codici sconto o bonus direttamente a specifici utenti.',
      quickLink: '/admin/sconti',
      quickLinkText: 'Gestisci Sconti',
      steps: [
        {
          title: 'Visualizzazione Sconti Utenti',
          detail: 'Consulta l\'elenco di tutti gli sconti sbloccati dagli utenti tramite i Collection Sets o concorsi.',
        },
        {
          title: 'Assegnazione Manuale (/admin/sconti/assegna)',
          detail: 'Seleziona un utente dal menu a tendina, digita il codice sconto (es. "VIP50"), la percentuale ed un messaggio di motivazione. Lo sconto sarà disponibile immediatamente nel profilo dell\'utente.',
        },
      ],
    },
    {
      id: 'sondaggi',
      category: 'Community',
      icon: '📊',
      title: 'Sondaggi & Community Feedback',
      badge: 'Sondaggi Dinamici',
      description: 'Come creare sondaggi con domande e risposte dinamiche per raccogliere opinioni e premiare la community.',
      quickLink: '/admin/sondaggi',
      quickLinkText: 'Gestisci Sondaggi',
      steps: [
        {
          title: 'Creazione Sondaggio Dinamico',
          detail: 'Nella pagina /admin/sondaggi/nuovo, definisci un titolo (es. "Quale nuovo elemento vorresti nel Set II?"), inserisci n domande con scelta singola, multipla o testo libero.',
        },
        {
          title: 'Popup Utente Automatico',
          detail: 'I sondaggi contrassegnati come "Attivo" vengono mostrati automaticamente agli utenti sul sito tramite il componente SurveyPopup.tsx.',
        },
        {
          title: 'Analisi Risposte & Statistiche',
          detail: 'Nella pagina del singolo sondaggio /admin/sondaggi/[id], l\'admin visualizza le percentuali di voto per ciascuna opzione e le risposte aperte per analizzare il feedback in tempo reale.',
        },
      ],
    },
    {
      id: 'infrastruttura',
      category: 'Tecnico',
      icon: '⚙️',
      title: 'Infrastruttura Stripe, PayPal & Supabase',
      badge: 'Integrazioni backend',
      description: 'Dettagli tecnici sui webhook di pagamento e la configurazione del database SQL Supabase.',
      quickLink: 'https://supabase.com',
      quickLinkText: 'Apri Supabase Dashboard',
      steps: [
        {
          title: 'Stripe Webhooks (/api/webhooks/stripe)',
          detail: 'Quando un utente completa il pagamento su Stripe Checkout, Stripe invia l\'evento checkout.session.completed al webhook di Kudjo, che eroga istantaneamente le buste digitali e calcola i ticket spettanti.',
        },
        {
          title: 'Tabelle Database Supabase',
          detail: 'Le tabelle principali sono: cards, pack_tiers, marketplace_items, concorsi, riffa_tickets, collection_sets, user_discounts, surveys, survey_questions, survey_responses.',
        },
      ],
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return wikiSections;
    const q = searchQuery.toLowerCase();
    return wikiSections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        sec.category.toLowerCase().includes(q) ||
        sec.steps.some((s) => s.title.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q))
    );
  }, [searchQuery, wikiSections]);

  const activeSection = useMemo(() => {
    return wikiSections.find((s) => s.id === activeSectionId) || wikiSections[0];
  }, [activeSectionId, wikiSections]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento Manuale & Wiki Admin...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top Bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
            <span className="text-neutral-700">/</span>
            <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
            <span className="text-neutral-700">/</span>
            <span className="text-white font-semibold">Guida & Admin Wiki</span>
          </div>

          <div className="relative w-64 sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cerca nella wiki (es. reset, PSA, ticket)..."
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
              📖 Manuale Operativo Completo
            </div>
            <h1 className="text-3xl font-light text-white">
              Guida Gestionale <span className="text-cyan-400 font-semibold">Kudjo Admin Wiki</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1 max-w-3xl">
              Documentazione completa ed istruzioni dettagliate passo-passo per gestire ogni funzionalità della piattaforma Kudjo TCG.
            </p>
          </div>

          <Link
            href="/admin"
            className="self-start md:self-auto bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            ← Torna al Pannello Admin
          </Link>
        </div>

        {/* Layout Grid: Left Sidebar Tabs + Right Detailed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-1">
              Moduli & Sezioni ({filteredSections.length})
            </div>

            <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
              {filteredSections.map((sec) => {
                const isActive = sec.id === activeSectionId;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-lg'
                        : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{sec.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                          {sec.title}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5 flex-shrink-0">
                          {sec.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{sec.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Detailed Section Content */}
          <div className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-8">
            {/* Section Header */}
            <div className="border-b border-white/5 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    {activeSection.icon}
                  </span>
                  <div>
                    <span className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-wider">
                      {activeSection.badge}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-0.5">{activeSection.title}</h2>
                  </div>
                </div>

                {activeSection.quickLink.startsWith('http') ? (
                  <a
                    href={activeSection.quickLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow"
                  >
                    <span>🔗</span> {activeSection.quickLinkText}
                  </a>
                ) : (
                  <Link
                    href={activeSection.quickLink}
                    className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow"
                  >
                    <span>⚡</span> {activeSection.quickLinkText}
                  </Link>
                )}
              </div>

              <p className="text-sm text-neutral-300 mt-4 leading-relaxed">{activeSection.description}</p>
            </div>

            {/* Important Notes Callout */}
            {activeSection.importantNotes && activeSection.importantNotes.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <span>⚠️</span> Avvertenza & Regola Importante
                </div>
                {activeSection.importantNotes.map((note, idx) => (
                  <p key={idx} className="text-xs text-amber-200/90 leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            )}

            {/* Step-by-Step Procedure */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <span>📑</span> Procedura Dettagliata Operativa
              </h3>

              <div className="space-y-4">
                {activeSection.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-xl p-5 space-y-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed pl-9">{step.detail}</p>

                    {step.code && (
                      <div className="pl-9 pt-2">
                        <pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                          {step.code}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Quick Navigation */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500">
              <span>Sezione Wiki: {activeSection.category}</span>
              <span className="font-mono">ID: {activeSection.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
