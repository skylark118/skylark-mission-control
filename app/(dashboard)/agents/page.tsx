import { mcClient } from '@/lib/supabase/clients';
import type { Agent, AgentEvent, Task } from '@/types';
import { AgentsView } from '@/components/agents/agents-view';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const supabase = mcClient();
  const [{ data: agents }, { data: events }, { data: tasks }] = await Promise.all([
    supabase.from('agents').select('*'),
    supabase.from('agent_events').select('*').order('created_at', { ascending: false }).limit(40),
    supabase
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress', 'blocked'])
      .order('updated_at', { ascending: false }),
  ]);

  // Pin Stella first, others alphabetical
  const sortedAgents = ((agents as Agent[]) || []).slice().sort((a, b) => {
    if (a.role === 'orchestrator') return -1;
    if (b.role === 'orchestrator') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Real-time operational status — what each agent is doing right now.
      </p>

      <AgentsView
        initialAgents={sortedAgents}
        initialEvents={(events as AgentEvent[]) || []}
        initialTasks={(tasks as Task[]) || []}
      />
    </div>
  );
}
