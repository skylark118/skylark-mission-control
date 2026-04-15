import { AgentStatusCard } from '@/components/dashboard/agent-status-card';
import { TaskStatsCards } from '@/components/dashboard/task-stats-cards';
import { createClient } from '@/lib/supabase/server';
import type { AgentWithEvents, Task } from '@/types';

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

  // Pin Stella first, then the rest alphabetical
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.name === 'Stella') return -1;
    if (b.name === 'Stella') return 1;
    return a.name.localeCompare(b.name);
  });

  // Fetch latest event for each agent
  const agentsWithEvents: AgentWithEvents[] = await Promise.all(
    sortedAgents.map(async (agent) => {
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

  // Fetch tasks for stats cards (realtime on client)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl">Overview</h1>
        <p className="text-muted-foreground">
          Monitor your agent team in real-time
        </p>
      </div>

      <TaskStatsCards initialTasks={(tasks as Task[]) || []} />

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Agents</h2>
          <p className="text-sm text-muted-foreground">
            {agentsWithEvents.length} on the team
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {agentsWithEvents.map((agent) => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>
    </div>
  );
}
