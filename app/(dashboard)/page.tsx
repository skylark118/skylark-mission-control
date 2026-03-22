import { AgentStatusCard } from '@/components/dashboard/agent-status-card';
import { createClient } from '@/lib/supabase/server';
import type { AgentWithEvents } from '@/types';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const supabase = await createClient();

  // Fetch agents with their latest event
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('name');

  if (!agents) {
    return <div>Loading...</div>;
  }

  // Fetch latest event for each agent
  const agentsWithEvents: AgentWithEvents[] = await Promise.all(
    agents.map(async (agent) => {
      const { data: latestEvent } = await supabase
        .from('agent_events')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...agent,
        latest_event: latestEvent || undefined,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Monitor your agent team in real-time
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {agentsWithEvents.map((agent) => (
          <AgentStatusCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
