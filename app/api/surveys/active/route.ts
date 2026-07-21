import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET /api/surveys/active - Get the latest active survey the current user has not responded to yet
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ survey: null, message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ survey: null, message: 'No token' });
    }

    // Authenticate the user using the token
    const { supabase } = await import('@/lib/supabase');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ survey: null, message: 'Invalid session' });
    }

    const userId = user.id;

    // 1. Get all published surveys (newest first)
    const { data: publishedSurveys, error: sError } = await supabaseAdmin
      .from('surveys')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (sError) {
      return NextResponse.json({ error: sError.message }, { status: 500 });
    }

    if (!publishedSurveys || publishedSurveys.length === 0) {
      return NextResponse.json({ survey: null });
    }

    // 2. Get user responses to find which surveys they already completed
    const { data: userResponses, error: rError } = await supabaseAdmin
      .from('survey_responses')
      .select('survey_id')
      .eq('user_id', userId);

    if (rError) {
      return NextResponse.json({ error: rError.message }, { status: 500 });
    }

    const completedSurveyIds = new Set((userResponses || []).map(r => r.survey_id));

    // 3. Find the first published survey that the user hasn't completed
    const activeSurvey = publishedSurveys.find(s => !completedSurveyIds.has(s.id));

    if (!activeSurvey) {
      return NextResponse.json({ survey: null });
    }

    // 4. Fetch the questions for the active survey
    const { data: questions, error: qError } = await supabaseAdmin
      .from('survey_questions')
      .select('*')
      .eq('survey_id', activeSurvey.id)
      .order('order_index', { ascending: true });

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    return NextResponse.json({
      survey: {
        id: activeSurvey.id,
        title: activeSurvey.title,
        description: activeSurvey.description,
        questions: questions || []
      }
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/surveys/active] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
