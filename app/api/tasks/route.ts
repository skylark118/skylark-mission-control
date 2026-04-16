import { NextRequest, NextResponse } from 'next/server';
import { mcClient } from '@/lib/supabase/clients';
import { requireWebhookAuth } from '@/lib/webhook-auth';

export async function POST(request: NextRequest) {
  try {
    const unauth = requireWebhookAuth(request);
    if (unauth) return unauth;

    const body = await request.json();
    const {
      title,
      description,
      assigned_to,
      created_by,
      priority,
      project_id,
      milestone_id,
      task_type,
      scheduled_task_id,
      metadata,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: task, error } = await mcClient()
      .from('tasks')
      .insert({
        title,
        description: description || null,
        assigned_to: assigned_to || null,
        created_by: created_by || null,
        priority: priority || 'medium',
        status: 'pending',
        project_id: project_id || null,
        milestone_id: milestone_id || null,
        task_type: task_type || (project_id ? 'project' : 'ad_hoc'),
        scheduled_task_id: scheduled_task_id || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const unauth = requireWebhookAuth(request);
    if (unauth) return unauth;

    const params = request.nextUrl.searchParams;
    const agent_id = params.get('agent_id');
    const status = params.get('status');
    const project_id = params.get('project_id');
    const milestone_id = params.get('milestone_id');
    const task_type = params.get('task_type');

    let query = mcClient()
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (agent_id) query = query.eq('assigned_to', agent_id);
    if (status) query = query.eq('status', status);
    if (project_id) query = query.eq('project_id', project_id);
    if (milestone_id) query = query.eq('milestone_id', milestone_id);
    if (task_type) query = query.eq('task_type', task_type);

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
