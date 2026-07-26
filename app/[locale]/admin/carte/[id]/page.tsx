'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';
import Image from 'next/image';
import KudjoCard from '@/app/components/KudjoCard';
import { KudjoCardElemento } from '@/lib/schema/kudjo-card';


type Params = Promise<{ id: string }>;

export default function AdminEditCartaPage(props: { params: Params }) {
  const { id } = use(props.params);
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [numero, setNumero] = useState(1);
  const [nome, setNome] = useState('');
  const [elemento, setElemento] = useState('Fuoco');
  const [rarita, setRarita] = useState<'comune' | 'non_comune' | 'raro'>('comune');
  const [potere, setPotere] = useState(500);
  const [descrizione, setDescrizione] = useState('');
  const [immagineUrl, setImmagineUrl] = useState('');

  useEffect(() => {
    const init = async () => {
      const admin = await verifyAdminAccess();
      if (!admin) {
        router.replace('/');
        return;
      }
      const tok = admin.token;
      setToken(tok);

      try {
        const res = await fetch(`/api/admin/cards/${id}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        const json = await res.json();
        if (json.card) {
          setNumero(json.card.numero);
          setNome(json.card.nome);
          setElemento(json.card.elemento);
          setRarita(json.card.rarita);
          setPotere(json.card.potere);
          setDescrizione(json.card.descrizione || '');
          setImmagineUrl(json.card.immagine_url || '');
        } else if (json.error) {
          setErrorMsg(json.error);
        }
      } catch (err: unknown) {
        console.error(err);
      }

      setLoading(false);
    };
    init();
  }, [locale, router, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim()) {
      setErrorMsg('Inserisci il nome della carta.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero,
          nome,
          elemento,
          rarita,
          potere,
          descrizione,
          immagine_url: immagineUrl || undefined,
        }),
      });

      const json = await res.json();
      setSaving(false);

      if (json.error) {
        setErrorMsg(json.error);
        return;
      }

      router.push('/admin/carte');
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Errore durante l\'aggiornamento della carta.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento carta...</div>
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
          <span className="text-white font-semibold">Modifica Carta {id}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Modifica Carta <span className="text-cyan-400 font-semibold">{nome || id}</span>
          </h1>
          <p className="text-neutral-500 text-sm">Aggiorna le informazioni, l&apos;immagine o la descrizione della carta.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  Numero Carta *
                </label>
                <input
                  type="number"
                  min="1"
                  value={numero}
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  Nome Carta *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
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
                  value={elemento}
                  onChange={(e) => setElemento(e.target.value)}
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
                  value={rarita}
                  onChange={(e) => setRarita(e.target.value as 'comune' | 'non_comune' | 'raro')}
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
                  value={potere}
                  onChange={(e) => setPotere(Number(e.target.value))}
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
                value={immagineUrl}
                onChange={(e) => setImmagineUrl(e.target.value)}
                placeholder="/cards/kj_001.png o URL immagine"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Descrizione Carta (Opzionale)
              </label>
              <textarea
                rows={4}
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

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
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider px-8 py-3 rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Anteprima Carta</div>
            <div className="bg-white/[0.02] border border-cyan-500/30 rounded-xl p-4 space-y-3 flex flex-col items-center">
              {immagineUrl ? (
                <div className="relative aspect-[3/4] w-full rounded-lg bg-neutral-900 overflow-hidden border border-white/10">
                  <Image
                    src={immagineUrl}
                    alt={nome || 'Carta'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute top-2 left-2 bg-black/80 text-white font-mono text-xs px-2 py-0.5 rounded border border-white/10 font-bold">
                    #{numero}
                  </span>
                </div>
              ) : (
                <KudjoCard
                  card={{
                    id,
                    numero,
                    nome: nome || 'Carta',
                    elemento: (elemento.toLowerCase() as KudjoCardElemento) || 'fuoco',
                    rarita,
                    descrizione: descrizione || '',
                    potere,
                  }}
                  size="normal"
                  disableZoom
                />
              )}

              <div className="w-full">
                <h3 className="text-sm font-bold text-white">{nome || 'Nome Carta'}</h3>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-neutral-400">{elemento}</span>
                  <span className="font-mono text-cyan-400 font-bold">PWR: {potere}</span>
                </div>
              </div>

              <div className="text-xs text-neutral-400 leading-relaxed border-t border-white/5 pt-2 w-full">
                {descrizione || 'Nessuna descrizione inserita.'}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
