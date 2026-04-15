import { NextRequest, NextResponse } from 'next/server';
import { nexusClient } from '@/lib/supabase/clients';
import { requireWebhookAuth } from '@/lib/webhook-auth';

export async function GET(request: NextRequest) {
  const unauth = requireWebhookAuth(request);
  if (unauth) return unauth;

  const params = request.nextUrl.searchParams;
  const type = params.get('type');
  const search = params.get('search');
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '50', 10) || 50, 1), 200);

  let query = nexusClient()
    .from('client_documents')
    .select(
      'id, client_id, title, description, file_type, filename, knowledge_type, privacy_level, business_category, status, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) query = query.eq('file_type', type);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching client_documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
