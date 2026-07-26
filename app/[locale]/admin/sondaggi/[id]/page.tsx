'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { verifyAdminAccess } from '@/lib/adminAuth';


interface Question {
  id: string;
  question_text: string;
  question_type: 'open' | 'multiple_choice';
  options: string[] | null;
  order_index: number;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

interface UserResponse {
  id: string;
  created_at: string;
  user: {
    email: string;
    full_name: string;
  };
  answers: Record<string, string>; // Maps question_id to answer_text
}

const STATO_COLORS: Record<string, string> = {
  draft: 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30',
  published: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  archived: 'bg-neutral-800/40 text-neutral-500 border-neutral-700/30',
};

const STATO_LABELS: Record<string, string> = {
  draft: 'ðŸ“‹ Bozza',
  published: 'ðŸŸ¢ Pubblicato',
  archived: 'â›” Archiviato',
};

function fmt(dt: string | null) {
  if (!dt) return 'â€”';
  return new Date(dt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type Params = Promise<{ id: string }>;

export default function SurveyResultsPage(props: { params: Params }) {
  const { id } = use(props.params);
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'responses'>('stats');

  useEffect(() => {
    const init = async () => {
      const admin = await verifyAdminAccess();
      if (!admin) {
        router.replace('/');
        return;
      }
      const tok = admin.token;
      setIsAdmin(true);

      try {
        const res = await fetch(`/api/admin/surveys/${id}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        const json = await res.json();
        if (json.error) {
          setError(json.error);
          setLoading(false);
          return;
        }

        setSurvey(json.survey);
        setQuestions(json.questions);
        setResponses(json.responses);
        setLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || 'Errore nel recupero del sondaggio.');
        setLoading(false);
      }
    };
    init();
  }, [id, locale, router]);

  // Aggregate stats helper for multiple choice
  const getMultipleChoiceStats = (qId: string, options: string[]) => {
    const counts: Record<string, number> = {};
    options.forEach(opt => {
      counts[opt] = 0;
    });

    let totalAnswers = 0;
    responses.forEach(r => {
      const ans = r.answers[qId];
      if (ans) {
        counts[ans] = (counts[ans] || 0) + 1;
        totalAnswers++;
      }
    });

    return {
      counts,
      totalAnswers,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
        <div className="text-neutral-500 text-sm animate-pulse">Caricamento statistiche...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] text-white font-sans flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-6 max-w-md text-center">
          <p className="text-sm font-semibold mb-4">{error}</p>
          <Link href="/admin/sondaggi" className="text-xs bg-white text-black px-4 py-2 rounded font-bold uppercase tracking-wider">
            Torna ai sondaggi
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin || !survey) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">â† Sito</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">Admin</Link>
          <span className="text-neutral-700">/</span>
          <Link href="/admin/sondaggi" className="text-neutral-400 hover:text-white transition-colors">Sondaggi</Link>
          <span className="text-neutral-700">/</span>
          <span className="text-white font-semibold truncate max-w-[200px]">{survey.title}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="border-b border-white/5 pb-8 mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-light text-white">{survey.title}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${STATO_COLORS[survey.status]}`}>
                {STATO_LABELS[survey.status]}
              </span>
            </div>
            {survey.description && (
              <p className="text-sm text-neutral-400 max-w-2xl">{survey.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 text-xs md:text-right text-neutral-500">
            <div>
              <div className="text-neutral-600 text-[10px] uppercase tracking-wider">Risposte Raccolte</div>
              <div className="text-2xl font-semibold text-purple-400">{responses.length}</div>
            </div>
            <div>
              <div className="text-neutral-600 text-[10px] uppercase tracking-wider">Ultimo Aggiornamento</div>
              <div>{fmt(survey.updated_at)}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ðŸ“Š Statistiche Domande
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-6 py-3 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
              activeTab === 'responses'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ðŸ‘¤ Risposte Singole ({responses.length})
          </button>
        </div>

        {/* Tab Content: Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fade-in">
            {questions.map((q, idx) => {
              const isOpen = q.question_type === 'open';
              return (
                <div key={q.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h2 className="text-base font-semibold text-white">
                      <span className="text-purple-400 mr-2">Q{idx + 1}.</span>
                      {q.question_text}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-neutral-700 text-neutral-400 bg-neutral-800/55 shrink-0">
                      {isOpen ? 'Aperta' : 'A scelta multipla'}
                    </span>
                  </div>

                  {isOpen ? (
                    /* Open Question Answers List */
                    <div className="space-y-3">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-semibold">Risposte inserite:</div>
                      {responses.filter(r => r.answers[q.id]?.trim()).length === 0 ? (
                        <p className="text-sm text-neutral-600 italic">Nessuna risposta fornita per questa domanda.</p>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-2 border-l border-purple-500/20 pl-4">
                          {responses
                            .filter(r => r.answers[q.id]?.trim())
                            .map((r) => (
                              <div key={r.id} className="text-sm text-neutral-300 bg-white/[0.01] border border-white/[0.02] rounded-lg p-3">
                                <p className="mb-1.5 leading-relaxed">{r.answers[q.id]}</p>
                                <span className="text-[10px] text-neutral-500">
                                  Da: <strong className="text-neutral-400 font-medium">{r.user.full_name || r.user.email}</strong> ({fmt(r.created_at)})
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Multiple Choice Question Distribution */
                    <div className="space-y-4">
                      {(() => {
                        const { counts, totalAnswers } = getMultipleChoiceStats(q.id, q.options || []);
                        return (q.options || []).map((opt, oIdx) => {
                          const count = counts[opt] || 0;
                          const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                          return (
                            <div key={oIdx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-300 font-medium">{opt}</span>
                                <span className="text-neutral-400 text-xs">
                                  <strong>{count}</strong> voti ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: Responses Table */}
        {activeTab === 'responses' && (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden animate-fade-in">
            {responses.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 text-sm">
                Nessuna risposta ancora registrata per questo sondaggio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-4 px-6">Utente</th>
                      <th className="py-4 px-6">Data Risposta</th>
                      {questions.map((q, idx) => (
                        <th key={q.id} className="py-4 px-6 max-w-[200px] truncate" title={q.question_text}>
                          Q{idx + 1}: {q.question_text}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors text-sm text-neutral-300">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-white truncate max-w-[200px]">{r.user.full_name || 'â€”'}</div>
                          <div className="text-xs text-neutral-500 truncate max-w-[200px]">{r.user.email}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-xs text-neutral-500">
                          {fmt(r.created_at)}
                        </td>
                        {questions.map((q) => (
                          <td key={q.id} className="py-4 px-6 max-w-[250px] break-words">
                            {r.answers[q.id] ? (
                              <span className="text-xs leading-relaxed">{r.answers[q.id]}</span>
                            ) : (
                              <span className="text-xs text-neutral-600 italic">Nessuna risposta</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
