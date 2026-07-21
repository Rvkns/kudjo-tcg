'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['kudjotcg@gmail.com', 'sentz01@gmail.com'];

interface FormQuestion {
  question_text: string;
  question_type: 'open' | 'multiple_choice';
  options: string[];
}

export default function NuovoSondaggioPage() {
  const locale = useLocale();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    { question_text: '', question_type: 'multiple_choice', options: ['', ''] }
  ]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() ?? '';
      if (!ADMIN_EMAILS.includes(email)) {
        router.replace('/');
        return;
      }
      setToken(session?.access_token ?? '');
      setLoading(false);
    };
    init();
  }, [locale, router]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', question_type: 'multiple_choice', options: ['', ''] }
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length === 1) {
      alert('Il sondaggio deve contenere almeno una domanda.');
      return;
    }
    const newQuestions = questions.filter((_, idx) => idx !== qIndex);
    setQuestions(newQuestions);
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].question_text = text;
    setQuestions(newQuestions);
  };

  const handleQuestionTypeChange = (qIndex: number, type: 'open' | 'multiple_choice') => {
    const newQuestions = [...questions];
    newQuestions[qIndex].question_type = type;
    if (type === 'multiple_choice' && newQuestions[qIndex].options.length === 0) {
      newQuestions[qIndex].options = ['', ''];
    }
    setQuestions(newQuestions);
  };

  const handleAddOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) {
      alert('Una domanda a scelta multipla richiede almeno due opzioni.');
      return;
    }
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, idx) => idx !== oIndex);
    setQuestions(newQuestions);
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = text;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      setError('Il titolo del sondaggio è obbligatorio.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`La domanda #${i + 1} non può essere vuota.`);
        return;
      }
      if (q.question_type === 'multiple_choice') {
        const filledOptions = q.options.filter(opt => opt.trim());
        if (filledOptions.length < 2) {
          setError(`La domanda #${i + 1} deve contenere almeno due opzioni compilate.`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');

    // Format questions body
    const formattedQuestions = questions.map(q => ({
      question_text: q.question_text.trim(),
      question_type: q.question_type,
      options: q.question_type === 'multiple_choice' 
        ? q.options.map(o => o.trim()).filter(o => o !== '') 
        : null
    }));

    try {
      const res = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          questions: formattedQuestions
        })
      });

      const json = await res.json();
      setSaving(false);

      if (json.error) {
        setError(json.error);
        return;
      }

      router.push('/admin/sondaggi');
    } catch (err: any) {
      setSaving(false);
      setError(err.message || "Errore durante il salvataggio.");
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">← Sito</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin/sondaggi" className="text-neutral-400 hover:text-white transition-colors">Sondaggi</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold">Nuovo</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-white mb-1">
            Nuovo <span className="text-purple-400 font-semibold">Sondaggio</span>
          </h1>
          <p className="text-neutral-500 text-sm">Crea un sondaggio inserendo le domande e specificando se sono aperte o chiuse a scelta multipla.</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{error}</div>
          )}

          {/* Dettagli Sondaggio */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest">Dettagli Sondaggio</h2>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Titolo Sondaggio *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Sondaggio Gradimento Kudjo v2"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Descrizione / Sottotitolo</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Inserisci una descrizione che verrà mostrata agli utenti nel pop-up..."
                rows={3}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Domande */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest px-1">Domande</h2>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-4 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Rimuovi Domanda
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Domanda #{qIdx + 1}</span>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Testo della Domanda *</label>
                  <input
                    type="text"
                    value={q.question_text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder="Scrivi qui la domanda..."
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">Tipo di Risposta</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(qIdx, 'multiple_choice')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                        q.question_type === 'multiple_choice'
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                          : 'bg-transparent border-white/5 text-neutral-500 hover:border-white/20'
                      }`}
                    >
                      🔘 Scelta Multipla
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(qIdx, 'open')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                        q.question_type === 'open'
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                          : 'bg-transparent border-white/5 text-neutral-500 hover:border-white/20'
                      }`}
                    >
                      ✍️ Risposta Aperta
                    </button>
                  </div>
                </div>

                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs text-neutral-400 uppercase tracking-wider">Opzioni di Risposta (Scelte) *</label>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-600 w-6 text-right font-mono">{oIdx + 1}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                            placeholder={`Opzione ${oIdx + 1}`}
                            className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIdx, oIdx)}
                            className="text-neutral-500 hover:text-red-400 text-xs px-2 py-1 transition-colors cursor-pointer"
                          >
                            Elimina
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIdx)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 pt-1 cursor-pointer"
                    >
                      ➕ Aggiungi Opzione
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-4 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl text-xs font-semibold text-neutral-400 hover:text-purple-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              ➕ Aggiungi Domanda
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/admin/sondaggi"
              className="flex-1 text-center py-3 border border-white/10 rounded-lg text-sm text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              Annulla
            </Link>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-bold uppercase tracking-wider py-3 rounded-lg border border-white/5 hover:border-white/10 transition-all"
            >
              Salva Bozza
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold uppercase tracking-wider py-3 rounded-lg transition-all"
            >
              {saving ? 'Salvataggio...' : 'Pubblica e Rilascia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
