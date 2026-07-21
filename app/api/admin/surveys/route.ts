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

// GET /api/admin/surveys - Get all surveys with response counts
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const { data, error } = await supabaseAdmin
    .from('surveys')
    .select('*, survey_responses(count)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const surveys = (data || []).map((s: any) => {
    // Extract count from array
    const countVal = s.survey_responses?.[0]?.count ?? s.survey_responses?.count ?? 0;
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      response_count: countVal,
    };
  });

  return NextResponse.json({ surveys });
}

// POST /api/admin/surveys - Create a new survey with questions
export async function POST(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const { title, description, status, questions } = body;

    if (!title) {
      return NextResponse.json({ error: 'Il titolo del sondaggio è obbligatorio' }, { status: 400 });
    }

    // 1. Insert survey
    const { data: survey, error: sError } = await supabaseAdmin
      .from('surveys')
      .insert({
        title,
        description: description || null,
        status: status || 'draft',
      })
      .select()
      .single();

    if (sError) {
      return NextResponse.json({ error: sError.message }, { status: 500 });
    }

    // 2. Insert questions if any
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, idx: number) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? (q.options || []) : null,
        order_index: idx,
      }));

      const { error: qError } = await supabaseAdmin
        .from('survey_questions')
        .insert(questionsToInsert);

      if (qError) {
        // Rollback survey creation
        await supabaseAdmin.from('surveys').delete().eq('id', survey.id);
        return NextResponse.json({ error: qError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ survey }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
