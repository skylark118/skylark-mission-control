import { ActivityFeed } from '@/components/activity/activity-feed';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const supabase = await createClient();

  const [{ data: events }, { data: agents }] = await Promise.all([
    supabase
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('agents').select('*').order('name'),
  ]);

  const sortedAgents = (agents || []).slice().sort((a, b) => {
    if (a.name === 'Stella') return -1;
    if (b.name === 'Stella') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl">Activity Feed</h1>
        <p className="text-muted-foreground">
          Real-time activity from all agents
        </p>
      </div>

      <ActivityFeed initialEvents={events || []} agents={sortedAgents} />
    </div>
  );
}
