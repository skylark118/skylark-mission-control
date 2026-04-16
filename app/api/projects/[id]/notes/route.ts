import { NextRequest, NextResponse } from 'next/server';
import { mcClient } from '@/lib/supabase/clients';
import { requireWebhookAuth } from '@/lib/webhook-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauth = requireWebhookAuth(request);
    if (unauth) return unauth;

    const { id: project_id } = await params;
    const body = await request.json();
    const { title, content, note_type, milestone_id, author_agent_id, metadata } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: note, error } = await mcClient()
      .from('project_notes')
      .insert({
        project_id,
        title: title || null,
        content,
        note_type: note_type || 'note',
        milestone_id: milestone_id || null,
        author_agent_id: author_agent_id || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauth = requireWebhookAuth(request);
    if (unauth) return unauth;

    const { id: project_id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const note_type = searchParams.get('note_type');
    const milestone_id = searchParams.get('milestone_id');

    let query = mcClient()
      .from('project_notes')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    if (note_type) query = query.eq('note_type', note_type);
    if (milestone_id) query = query.eq('milestone_id', milestone_id);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching project notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
