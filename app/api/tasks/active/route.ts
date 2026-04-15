import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/tasks/active - all non-complete tasks sorted by priority then created_at
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'complete')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort by priority (urgent > high > medium > low), then by created_at (already desc)
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = (tasks || []).sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99;
      const pb = priorityOrder[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error in GET /api/tasks/active:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
