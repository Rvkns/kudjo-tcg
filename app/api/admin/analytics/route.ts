import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCardById } from '@/lib/data/kudjo-cards-db';

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

const TIER_PRICES: Record<string, number> = {
  bronze: 5,
  silver: 25,
  gold: 50,
  platinum: 100,
};

// GET /api/admin/analytics - Comprehensive analytics and KPIs
export async function GET(request: Request) {
  const guard = await assertAdmin(request);
  if (guard instanceof NextResponse) return guard;

  try {
    // 1. Fetch pending_packs for sales & hourly distribution
    const { data: packsRaw } = await supabaseAdmin
      .from('pending_packs')
      .select('tier, quantity, created_at, user_id');

    interface DBPackRow {
      tier: string;
      quantity: number;
      created_at: string;
      user_id: string;
    }

    const packs = (packsRaw as unknown as DBPackRow[] || []);

    let totalPacksCount = 0;
    let estimatedRevenue = 0;
    const tierPacksMap: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    const hourlyPacksMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyPacksMap[h] = 0;

    packs.forEach(p => {
      const q = p.quantity || 0;
      totalPacksCount += q;
      const tierKey = (p.tier || '').toLowerCase();
      if (tierPacksMap[tierKey] !== undefined) {
        tierPacksMap[tierKey] += q;
        estimatedRevenue += q * (TIER_PRICES[tierKey] || 0);
      }

      if (p.created_at) {
        const hour = new Date(p.created_at).getHours();
        if (hour >= 0 && hour < 24) {
          hourlyPacksMap[hour] += q;
        }
      }
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      packs: hourlyPacksMap[h] || 0,
    }));

    // 2. Fetch user_collection for card pull stats & leaderboards
    const { data: collectionRaw } = await supabaseAdmin
      .from('user_collection')
      .select('user_id, card_id, quantity, profiles(email, full_name)');

    interface DBCollectionRow {
      user_id: string;
      card_id: string;
      quantity: number;
      profiles: { email: string; full_name: string } | null;
    }

    const collection = (collectionRaw as unknown as DBCollectionRow[] || []);

    let totalCardsPulled = 0;
    const cardDropMap: Record<string, number> = {};
    const userCardsSummary: Record<string, { email: string; full_name: string; uniqueSet: Set<string>; totalCount: number }> = {};
    const rarityDistribution: Record<string, number> = { comune: 0, non_comune: 0, raro: 0 };
    const elementDistribution: Record<string, number> = {};

    collection.forEach(item => {
      const q = item.quantity || 0;
      totalCardsPulled += q;
      cardDropMap[item.card_id] = (cardDropMap[item.card_id] || 0) + q;

      // Group by user for leaderboard
      if (!userCardsSummary[item.user_id]) {
        userCardsSummary[item.user_id] = {
          email: item.profiles?.email || 'Sconosciuto',
          full_name: item.profiles?.full_name || 'Sconosciuto',
          uniqueSet: new Set(),
          totalCount: 0,
        };
      }
      userCardsSummary[item.user_id].uniqueSet.add(item.card_id);
      userCardsSummary[item.user_id].totalCount += q;

      // Card Metadata breakdown
      const cardInfo = getCardById(item.card_id);
      if (cardInfo) {
        rarityDistribution[cardInfo.rarita] = (rarityDistribution[cardInfo.rarita] || 0) + q;
        elementDistribution[cardInfo.elemento] = (elementDistribution[cardInfo.elemento] || 0) + q;
      }
    });

    // Top Pulled Cards & Rarest Pulled Cards
    const cardDropList = Object.entries(cardDropMap).map(([cardId, count]) => {
      const cardInfo = getCardById(cardId);
      return {
        card_id: cardId,
        numero: cardInfo?.numero || 0,
        nome: cardInfo?.nome || cardId,
        rarita: cardInfo?.rarita || 'comune',
        elemento: cardInfo?.elemento || 'vari',
        potere: cardInfo?.potere || 0,
        pull_count: count,
      };
    });

    const topPulledCards = [...cardDropList].sort((a, b) => b.pull_count - a.pull_count).slice(0, 5);
    const rarestPulledCards = [...cardDropList].sort((a, b) => a.pull_count - b.pull_count).slice(0, 5);

    // Top Collectors Leaderboard
    const topCollectors = Object.values(userCardsSummary)
      .map(u => ({
        email: u.email,
        full_name: u.full_name,
        unique_cards: u.uniqueSet.size,
        total_cards: u.totalCount,
      }))
      .sort((a, b) => b.unique_cards - a.unique_cards || b.total_cards - a.total_cards)
      .slice(0, 8);

    // 3. Fetch Tickets, Discounts, Users & Surveys totals
    const [ticketsRes, discountsRes, usersRes, surveysRes] = await Promise.all([
      supabaseAdmin.from('user_tickets').select('quantity'),
      supabaseAdmin.from('user_discounts').select('sconto_percentuale'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('survey_responses').select('id', { count: 'exact', head: true }),
    ]);

    const totalTickets = ((ticketsRes.data || []) as { quantity: number }[]).reduce((s, t) => s + (t.quantity || 0), 0);
    const discountsList = (discountsRes.data || []) as { sconto_percentuale: number }[];
    const totalDiscountsCount = discountsList.length;
    const avgDiscountPercent = totalDiscountsCount > 0
      ? Math.round(discountsList.reduce((s, d) => s + (d.sconto_percentuale || 0), 0) / totalDiscountsCount)
      : 0;

    const totalUsersCount = usersRes.count ?? 0;
    const totalSurveyResponses = surveysRes.count ?? 0;

    // 4. Fetch Surveys details & responses count
    const { data: surveysListRaw } = await supabaseAdmin
      .from('surveys')
      .select('id, title, status, created_at, survey_responses(count)')
      .order('created_at', { ascending: false });

    interface DBSurveyRow {
      id: string;
      title: string;
      status: string;
      created_at: string;
      survey_responses: { count: number }[] | { count: number } | null;
    }

    const surveysList = (surveysListRaw as unknown as DBSurveyRow[] || []).map(s => {
      let countVal = 0;
      if (s.survey_responses) {
        if (Array.isArray(s.survey_responses)) {
          countVal = s.survey_responses[0]?.count ?? 0;
        } else if (typeof s.survey_responses === 'object') {
          countVal = (s.survey_responses as { count: number }).count ?? 0;
        }
      }
      return {
        id: s.id,
        title: s.title,
        status: s.status,
        response_count: countVal,
      };
    });

    const publishedSurveysCount = surveysList.filter(s => s.status === 'published').length;

    return NextResponse.json({
      kpis: {
        estimated_revenue: estimatedRevenue,
        total_packs_count: totalPacksCount,
        total_users_count: totalUsersCount,
        total_cards_pulled: totalCardsPulled,
        total_tickets: totalTickets,
        total_discounts_count: totalDiscountsCount,
        avg_discount_percent: avgDiscountPercent,
        total_survey_responses: totalSurveyResponses,
      },
      tier_breakdown: {
        bronze: { packs: tierPacksMap.bronze, revenue: tierPacksMap.bronze * TIER_PRICES.bronze },
        silver: { packs: tierPacksMap.silver, revenue: tierPacksMap.silver * TIER_PRICES.silver },
        gold: { packs: tierPacksMap.gold, revenue: tierPacksMap.gold * TIER_PRICES.gold },
        platinum: { packs: tierPacksMap.platinum, revenue: tierPacksMap.platinum * TIER_PRICES.platinum },
      },
      hourly_distribution: hourlyDistribution,
      card_analytics: {
        top_pulled: topPulledCards,
        rarest_pulled: rarestPulledCards,
        rarity_distribution: rarityDistribution,
        element_distribution: elementDistribution,
      },
      top_collectors: topCollectors,
      surveys_summary: {
        published_count: publishedSurveysCount,
        total_responses: totalSurveyResponses,
        surveys_list: surveysList,
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
