import { NextRequest, NextResponse } from 'next/server';
import { nexusClient } from '@/lib/supabase/clients';
import { requireWebhookAuth } from '@/lib/webhook-auth';

export async function GET(request: NextRequest) {
  const unauth = requireWebhookAuth(request);
  if (unauth) return unauth;

  const params = request.nextUrl.searchParams;
  const agent = params.get('agent');
  const action = params.get('action');
  const search = params.get('search');
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '50', 10) || 50, 1), 200);

  let query = nexusClient()
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agent) query = query.eq('agent_id', agent);
  if (action) query = query.eq('action', action);
  if (search) {
    query = query.or(
      `input_summary.ilike.%${search}%,output_summary.ilike.%${search}%,action.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching activity_log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
