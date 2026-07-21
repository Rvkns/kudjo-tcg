import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

// POST /api/surveys/[id]/respond - Submit answers for a survey
export async function POST(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    // Authenticate the user
    const { supabase } = await import('@/lib/supabase');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid session' }, { status: 401 });
    }

    const userId = user.id;

    // Check if the survey is published
    const { data: survey, error: sError } = await supabaseAdmin
      .from('surveys')
      .select('status')
      .eq('id', id)
      .single();

    if (sError || !survey) {
      return NextResponse.json({ error: 'Sondaggio non trovato' }, { status: 404 });
    }

    if (survey.status !== 'published') {
      return NextResponse.json({ error: 'Questo sondaggio non è al momento attivo' }, { status: 400 });
    }

    const body = await request.json();
    const { answers } = body; // Array of { question_id: string, answer_text: string }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Formato risposte non valido' }, { status: 400 });
    }

    // 1. Insert survey response
    const { data: response, error: rError } = await supabaseAdmin
      .from('survey_responses')
      .insert({
        survey_id: id,
        user_id: userId
      })
      .select()
      .single();

    if (rError) {
      if (rError.code === '23505') { // postgres unique_violation code
        return NextResponse.json({ error: 'Hai già risposto a questo sondaggio.' }, { status: 409 });
      }
      return NextResponse.json({ error: rError.message }, { status: 500 });
    }

    // 2. Insert individual answers
    if (answers.length > 0) {
      const answersToInsert = answers.map((ans: any) => ({
        response_id: response.id,
        question_id: ans.question_id,
        answer_text: ans.answer_text ? String(ans.answer_text).trim() : null
      }));

      const { error: aError } = await supabaseAdmin
        .from('survey_answers')
        .insert(answersToInsert);

      if (aError) {
        // Rollback response insertion
        await supabaseAdmin.from('survey_responses').delete().eq('id', response.id);
        return NextResponse.json({ error: aError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/surveys/respond] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
