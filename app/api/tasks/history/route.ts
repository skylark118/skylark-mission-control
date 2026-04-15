import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/tasks/history?days=7 - completed tasks from last N days, newest first
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const daysParam = request.nextUrl.searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam || '7', 10) || 7, 1), 365);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'complete')
      .gte('updated_at', since.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching task history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('Error in GET /api/tasks/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
