'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

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
  questions: Question[];
}

export default function SurveyPopup() {
  const t = useTranslations('Surveys');
  const [user, setUser] = useState<any>(null);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationError, setValidationError] = useState(false);

  // 1. Listen for user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        checkActiveSurvey(session.access_token);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkActiveSurvey(session.access_token);
      } else {
        setActiveSurvey(null);
        setShowPopup(false);
        setShowModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Query active survey for user
  const checkActiveSurvey = async (token: string) => {
    try {
      const res = await fetch('/api/surveys/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      
      if (json.survey) {
        const surveyId = json.survey.id;
        // Check if dismissed in this session
        const dismissed = sessionStorage.getItem(`kudjo-survey-dismissed-${surveyId}`);
        if (!dismissed) {
          setActiveSurvey(json.survey);
          setShowPopup(true);
        }
      } else {
        setActiveSurvey(null);
        setShowPopup(false);
      }
    } catch (err) {
      console.error('Error checking active survey:', err);
    }
  };

  const handleDismissPopup = () => {
    if (activeSurvey) {
      sessionStorage.setItem(`kudjo-survey-dismissed-${activeSurvey.id}`, 'true');
    }
    setShowPopup(false);
  };

  const handleStartSurvey = () => {
    setShowPopup(false);
    setShowModal(true);
    setAnswers({});
    setSubmitSuccess(false);
    setErrorMsg('');
    setValidationError(false);
  };

  const handleAnswerSelect = (qId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSurvey) return;

    // Check validation: all questions are required
    const unanswered = activeSurvey.questions.filter(q => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      setValidationError(true);
      return;
    }

    setValidationError(false);
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErrorMsg('Sessione scaduta. Effettua nuovamente il login.');
        setSubmitting(false);
        return;
      }

      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([qId, text]) => ({
        question_id: qId,
        answer_text: text
      }));

      const res = await fetch(`/api/surveys/${activeSurvey.id}/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      const json = await res.json();
      setSubmitting(false);

      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setSubmitSuccess(true);
        // Hide popup permanently for this survey
        sessionStorage.setItem(`kudjo-survey-dismissed-${activeSurvey.id}`, 'true');
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(t('errorSubmit'));
    }
  };

  if (!user || !activeSurvey) return null;

  return (
    <>
      {/* 1. BOTTOM-RIGHT POP-UP */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0d0d0f]/95 backdrop-blur-md border border-purple-500/30 rounded-xl p-5 shadow-2xl animate-fade-in text-white">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
              <span className="text-purple-400">📊</span> {t('popupTitle')}
            </h3>
            <button
              onClick={handleDismissPopup}
              className="text-neutral-500 hover:text-white transition-colors text-xs p-1 cursor-pointer"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed mb-4">
            {activeSurvey.description || t('popupDesc')}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleDismissPopup}
              className="px-3.5 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {t('laterBtn')}
            </button>
            <button
              onClick={handleStartSurvey}
              className="px-4 py-1.5 rounded bg-purple-600 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all cursor-pointer"
            >
              {t('startBtn')}
            </button>
          </div>
        </div>
      )}

      {/* 2. SURVEY FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b0b0c] border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden animate-scale-up text-white my-8">
            
            {/* Modal Header */}
            <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-[#0d0d0f]/50">
              <h2 className="text-lg font-light text-white tracking-wide">
                {t('modalTitle')} — <span className="text-purple-400 font-semibold">{activeSurvey.title}</span>
              </h2>
              {!submitting && (
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {submitSuccess ? (
                /* Success State */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto text-purple-400 text-3xl animate-bounce">
                    ✓
                  </div>
                  <h3 className="text-xl font-semibold text-white">{t('successTitle')}</h3>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                    {t('successDesc')}
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold uppercase tracking-widest text-white transition-all cursor-pointer"
                  >
                    {t('closeBtn')}
                  </button>
                </div>
              ) : (
                /* Survey Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                  {activeSurvey.description && (
                    <p className="text-sm text-neutral-400 bg-white/[0.01] border border-white/5 rounded-lg p-3.5 leading-relaxed">
                      {activeSurvey.description}
                    </p>
                  )}

                  {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  {validationError && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg p-4 text-xs">
                      ⚠️ {t('requiredField')}
                    </div>
                  )}

                  <div className="space-y-6 divide-y divide-white/5">
                    {activeSurvey.questions.map((q, idx) => (
                      <div key={q.id} className={`${idx > 0 ? 'pt-6' : ''} space-y-3`}>
                        <label className="block text-sm font-semibold text-white">
                          <span className="text-purple-400 mr-1.5">Q{idx + 1}.</span>
                          {q.question_text}
                          <span className="text-red-500 ml-1 font-normal text-xs">*</span>
                        </label>

                        {q.question_type === 'open' ? (
                          /* Open response textarea */
                          <textarea
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                            placeholder={t('openQuestionPlaceholder')}
                            rows={3}
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
                            required
                          />
                        ) : (
                          /* Multiple choice choices */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(q.options || []).map((opt, oIdx) => {
                              const isSelected = answers[q.id] === opt;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleAnswerSelect(q.id, opt)}
                                  className={`flex items-center gap-3 p-3.5 rounded-lg border text-left text-xs tracking-wide transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-600/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(147,51,234,0.05)]'
                                      : 'bg-white/[0.01] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 ${
                                    isSelected 
                                      ? 'border-purple-400 text-purple-400' 
                                      : 'border-neutral-700 text-transparent'
                                  }`}>
                                    ●
                                  </span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-white/5 flex gap-3 justify-end bg-transparent">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {t('laterBtn')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(147,51,234,0.25)] transition-all cursor-pointer"
                    >
                      {submitting ? t('submitting') : t('submitBtn')}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
