import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/tasks/stats - counts for dashboard overview
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [pending, inProgress, blocked, review, completedToday, completedWeek] =
      await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'review'),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'complete')
          .gte('updated_at', startOfToday.toISOString()),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'complete')
          .gte('updated_at', startOfWeek.toISOString()),
      ]);

    const err = [pending, inProgress, blocked, review, completedToday, completedWeek].find(
      (r) => r.error
    )?.error;
    if (err) {
      console.error('Error fetching task stats:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    const pendingCount = pending.count ?? 0;
    const inProgressCount = inProgress.count ?? 0;
    const blockedCount = blocked.count ?? 0;
    const reviewCount = review.count ?? 0;

    return NextResponse.json({
      active: pendingCount + inProgressCount,
      by_status: {
        pending: pendingCount,
        in_progress: inProgressCount,
        blocked: blockedCount,
        review: reviewCount,
      },
      blocked: blockedCount,
      completed_today: completedToday.count ?? 0,
      completed_this_week: completedWeek.count ?? 0,
    });
  } catch (error) {
    console.error('Error in GET /api/tasks/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
