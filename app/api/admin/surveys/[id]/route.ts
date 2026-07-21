import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'kudjotcg@gmail.com,sentz01@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

async function assertAdmin(request: Request): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { supabase } = await import('@/lib/supabase');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden: not an admin' }, { status: 403 });
  }

  return { userId: user.id };
}

type Params = Promise<{ id: string }>;

// GET /api/admin/surveys/[id] - Get details, questions, and responses of a survey
export async function GET(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    // 1. Fetch survey
    const { data: survey, error: sError } = await supabaseAdmin
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (sError) {
      return NextResponse.json({ error: 'Sondaggio non trovato: ' + sError.message }, { status: 404 });
    }

    // 2. Fetch questions
    const { data: questions, error: qError } = await supabaseAdmin
      .from('survey_questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true });

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    // 3. Fetch responses with profile info
    const { data: responsesRaw, error: rError } = await supabaseAdmin
      .from('survey_responses')
      .select('id, created_at, user_id, profiles(email, full_name)')
      .eq('survey_id', id)
      .order('created_at', { ascending: false });

    if (rError) {
      return NextResponse.json({ error: rError.message }, { status: 500 });
    }

    // 4. Fetch answers
    let responses: any[] = [];
    if (responsesRaw && responsesRaw.length > 0) {
      const responseIds = responsesRaw.map(r => r.id);
      const { data: answersRaw, error: aError } = await supabaseAdmin
        .from('survey_answers')
        .select('id, response_id, question_id, answer_text')
        .in('response_id', responseIds);

      if (aError) {
        return NextResponse.json({ error: aError.message }, { status: 500 });
      }

      // Group answers by response ID
      const answersByResponse: Record<string, any[]> = {};
      (answersRaw || []).forEach(ans => {
        if (!answersByResponse[ans.response_id]) {
          answersByResponse[ans.response_id] = [];
        }
        answersByResponse[ans.response_id].push(ans);
      });

      responses = responsesRaw.map((r: any) => {
        const answersMap: Record<string, string> = {};
        (answersByResponse[r.id] || []).forEach(ans => {
          answersMap[ans.question_id] = ans.answer_text || '';
        });
        return {
          id: r.id,
          created_at: r.created_at,
          user: r.profiles || { email: 'Sconosciuto', full_name: 'Sconosciuto' },
          answers: answersMap,
        };
      });
    }

    return NextResponse.json({
      survey,
      questions: questions || [],
      responses,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/surveys/[id] - Update a survey
export async function PATCH(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { title, description, status } = body;

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    updateData.updated_at = new Date().toISOString();

    const { data: survey, error } = await supabaseAdmin
      .from('surveys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ survey });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/surveys/[id] - Delete a survey
export async function DELETE(request: Request, props: { params: Params }) {
  const { id } = await props.params;
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const { error } = await supabaseAdmin
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
