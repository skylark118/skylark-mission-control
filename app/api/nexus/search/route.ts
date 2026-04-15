import { NextRequest, NextResponse } from 'next/server';
import { nexusClient } from '@/lib/supabase/clients';
import { requireWebhookAuth } from '@/lib/webhook-auth';

export async function GET(request: NextRequest) {
  const unauth = requireWebhookAuth(request);
  if (unauth) return unauth;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
  }

  const perCategoryLimit = 20;
  const nexus = nexusClient();
  const [learnings, documents, activity] = await Promise.all([
    nexus
      .from('shared_learnings')
      .select('id, agent_id, category, learning, tags, created_at')
      .ilike('learning', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(perCategoryLimit),
    nexus
      .from('client_documents')
      .select(
        'id, title, description, file_type, knowledge_type, privacy_level, created_at'
      )
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(perCategoryLimit),
    nexus
      .from('activity_log')
      .select('id, agent_id, action, input_summary, output_summary, created_at')
      .or(`input_summary.ilike.%${q}%,output_summary.ilike.%${q}%,action.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(perCategoryLimit),
  ]);

  const firstError = [learnings, documents, activity].find((r) => r.error)?.error;
  if (firstError) {
    console.error('Error in nexus search:', firstError);
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    query: q,
    learnings: {
      count: learnings.data?.length ?? 0,
      items: learnings.data ?? [],
    },
    documents: {
      count: documents.data?.length ?? 0,
      items: documents.data ?? [],
    },
    activity: {
      count: activity.data?.length ?? 0,
      items: activity.data ?? [],
    },
  });
}
