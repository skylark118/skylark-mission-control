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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground">
          Real-time activity from all agents
        </p>
      </div>

      <ActivityFeed initialEvents={events || []} agents={agents || []} />
    </div>
  );
}
