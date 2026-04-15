import { NextRequest, NextResponse } from 'next/server';
import { mcClient, nexusClient } from '@/lib/supabase/clients';
import { requireWebhookAuth } from '@/lib/webhook-auth';

export async function GET(request: NextRequest) {
  const unauth = requireWebhookAuth(request);
  if (unauth) return unauth;

  const mc = mcClient();
  const nexus = nexusClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    agents,
    pending,
    inProgress,
    blocked,
    completedToday,
    completedWeek,
    recentEvents,
    activeTasks,
    learningCount,
  ] = await Promise.all([
    mc.from('agents').select('*'),
    mc.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    mc.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    mc.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    mc
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')
      .gte('updated_at', startOfToday.toISOString()),
    mc
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')
      .gte('updated_at', startOfWeek.toISOString()),
    mc
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    mc
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress', 'blocked'])
      .order('updated_at', { ascending: false })
      .limit(5),
    nexus.from('shared_learnings').select('*', { count: 'exact', head: true }),
  ]);

  const firstError = [
    agents,
    pending,
    inProgress,
    blocked,
    completedToday,
    completedWeek,
    recentEvents,
    activeTasks,
    learningCount,
  ].find((r) => r.error)?.error;
  if (firstError) {
    console.error('Error in /api/overview:', firstError);
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const pendingCount = pending.count ?? 0;
  const inProgressCount = inProgress.count ?? 0;

  return NextResponse.json({
    agents: agents.data ?? [],
    task_stats: {
      active: pendingCount + inProgressCount,
      pending: pendingCount,
      in_progress: inProgressCount,
      blocked: blocked.count ?? 0,
      completed_today: completedToday.count ?? 0,
      completed_this_week: completedWeek.count ?? 0,
    },
    learning_count: learningCount.count ?? 0,
    recent_events: recentEvents.data ?? [],
    active_tasks: activeTasks.data ?? [],
  });
}
