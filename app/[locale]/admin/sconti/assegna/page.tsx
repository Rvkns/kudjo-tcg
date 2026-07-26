'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';


interface ProfileUser {
  id: string;
  email: string;
  full_name: string;
}

interface Concorso {
  id: string;
  nome: string;
}

export default function AdminAssegnaScontoPage() {
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Users search & selection
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Form fields
  const [scontoPercentuale, setScontoPercentuale] = useState(15);
  const [customCode, setCustomCode] = useState('');
  const [concorsi, setConcorsi] = useState<Concorso[]>([]);
  const [selectedConcorsoId, setSelectedConcorsoId] = useState('');

  const searchUsers = useCallback(async (tok: string, query: string) => {
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const json = await res.json();
      if (json.users) {
        setUsers(json.users);
        if (json.users.length > 0 && !selectedUserId) {
          setSelectedUserId(json.users[0].id);
        }
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, [selectedUserId]);

  useEffect(() => {
    const init = async () => {
      const admin = await verifyAdminAccess();
      if (!admin) {
        router.replace('/');
        return;
      }
      const tok = admin.token;
      setToken(tok);

      // Fetch users and concorsi
      await searchUsers(tok, '');
      try {
        const cRes = await fetch('/api/admin/concorsi', { headers: { Authorization: `Bearer ${tok}` } });
        const cJson = await cRes.json();
        if (cJson.concorsi) {
          setConcorsi(cJson.concorsi);
        }
      } catch (err: unknown) {
        console.error(err);
      }

      setLoading(false);
    };
    init();
  }, [locale, router, searchUsers]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserSearch(val);
    if (token) {
      await searchUsers(token, val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedUserId) {
      setErrorMsg('Seleziona un utente destinatario dello sconto.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          sconto_percentuale: scontoPercentuale,
          code: customCode.trim() || undefined,
          concorso_id: selectedConcorsoId || undefined
        })
      });
      const json = await res.json();
      setSaving(false);

      if (json.error) {
        setErrorMsg(json.error);
        return;
      }

      router.push('/admin/sconti');
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Errore durante l\'assegnazione dello sconto.');
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
          <Link href="/admin/sconti" className="text-neutral-400 hover:text-white transition-colors">Sconti Utenti</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold">Assegna Sconto</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Assegna Sconto <span className="text-emerald-400 font-semibold">Manuale</span>
          </h1>
          <p className="text-neutral-500 text-sm">Crea e assegna un codice sconto ad un determinato utente della piattaforma.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.02] border border-white/5 rounded-xl p-6">
          {/* User selection */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Seleziona Utente *
            </label>
            <input
              type="text"
              value={userSearch}
              onChange={handleSearchChange}
              placeholder="Filtra utenti per email o nome..."
              className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
            />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              required
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Percentuale Sconto (%) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={scontoPercentuale}
                onChange={(e) => setScontoPercentuale(Number(e.target.value))}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Concorso Associato (Opzionale)
              </label>
              <select
                value={selectedConcorsoId}
                onChange={(e) => setSelectedConcorsoId(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">-- Nessun concorso specifico --</option>
                {concorsi.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
              Codice Sconto Personalizzato (Opzionale)
            </label>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Lascia vuoto per generare automaticamente (es. KUDJO-VIP15-X9Y2Z)"
              className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="border-t border-white/5 pt-6 flex items-center justify-end gap-4">
            <Link
              href="/admin/sconti"
              className="text-xs text-neutral-400 hover:text-white px-5 py-3 rounded-lg transition-colors"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Assegnazione...' : 'Assegna Sconto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
