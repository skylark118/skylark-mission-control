import Link from 'next/link';
import { mcClient, nexusClient } from '@/lib/supabase/clients';
import type { Agent, AgentEvent, Task } from '@/types';
import { OverviewStats } from '@/components/dashboard/overview-stats';
import { CompactAgentCard } from '@/components/dashboard/compact-agent-card';
import { AgentAvatar } from '@/components/agent-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const mc = mcClient();
  const nexus = nexusClient();

  const [
    agentsRes,
    tasksRes,
    recentEventsRes,
    activeTasksRes,
    learningCountRes,
  ] = await Promise.all([
    mc.from('agents').select('*'),
    mc.from('tasks').select('*').order('updated_at', { ascending: false }),
    mc.from('agent_events').select('*').order('created_at', { ascending: false }).limit(10),
    mc
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress', 'blocked'])
      .order('updated_at', { ascending: false })
      .limit(5),
    nexus.from('shared_learnings').select('*', { count: 'exact', head: true }),
  ]);

  const agents = (agentsRes.data as Agent[]) || [];
  const tasks = (tasksRes.data as Task[]) || [];
  const recentEvents = (recentEventsRes.data as AgentEvent[]) || [];
  const activeTasks = (activeTasksRes.data as Task[]) || [];
  const learningCount = learningCountRes.count ?? 0;

  const sortedAgents = agents.slice().sort((a, b) => {
    if (a.role === 'orchestrator') return -1;
    if (b.role === 'orchestrator') return 1;
    return a.name.localeCompare(b.name);
  });

  const latestEventByAgent: Record<string, AgentEvent> = {};
  for (const e of recentEvents) {
    if (!latestEventByAgent[e.agent_id]) latestEventByAgent[e.agent_id] = e;
  }

  const activeTaskByAgent: Record<string, Task> = {};
  for (const t of activeTasks) {
    if (t.assigned_to && t.status === 'in_progress' && !activeTaskByAgent[t.assigned_to]) {
      activeTaskByAgent[t.assigned_to] = t;
    }
  }

  const agentById = agents.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {} as Record<string, Agent>);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl">Mission Control</h1>
        <p className="text-muted-foreground">
          Skylark 118 · {agents.length} agents · {learningCount} shared learnings
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Stats
        </h2>
        <OverviewStats
          agentCount={agents.length}
          initialTasks={tasks}
          learningCount={learningCount}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Agents
          </h2>
          <Link
            href="/agents"
            className="inline-flex items-center gap-1 text-xs font-medium text-skylark-blue hover:underline"
          >
            Agent detail
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {sortedAgents.map((agent) => (
            <CompactAgentCard
              key={agent.id}
              agent={agent}
              latestEvent={latestEventByAgent[agent.id] ?? null}
              activeTask={activeTaskByAgent[agent.id] ?? null}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivitySection events={recentEvents} agentById={agentById} />
        <ActiveTasksSection tasks={activeTasks} agentById={agentById} />
      </div>
    </div>
  );
}

function RecentActivitySection({
  events,
  agentById,
}: {
  events: AgentEvent[];
  agentById: Record<string, Agent>;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </h2>
        <Link
          href="/activity"
          className="inline-flex items-center gap-1 text-xs font-medium text-skylark-blue hover:underline"
        >
          View all
          <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const agent = agentById[e.agent_id];
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                {agent && <AgentAvatar name={agent.name} size="sm" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {agent && <span className="font-semibold">{agent.name}</span>}{' '}
                    <span className="text-muted-foreground">{e.action}</span>
                  </p>
                </div>
                <span className="flex-none text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActiveTasksSection({
  tasks,
  agentById,
}: {
  tasks: Task[];
  agentById: Record<string, Agent>;
}) {
  const statusStyle: Record<Task['status'], string> = {
    pending: 'text-muted-foreground border-muted-foreground/30',
    in_progress: 'text-skylark-blue border-skylark-blue/40',
    review: 'text-skylark-orange border-skylark-orange/40',
    complete: 'text-emerald-700 border-emerald-500/40',
    blocked: 'text-red-600 border-red-500/40',
  };
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Active Tasks
        </h2>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-xs font-medium text-skylark-blue hover:underline"
        >
          View all
          <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No active tasks
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const agent = t.assigned_to ? agentById[t.assigned_to] : null;
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                {agent && <AgentAvatar name={agent.name} size="sm" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{t.title}</p>
                </div>
                <span
                  className={cn(
                    'flex-none rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                    statusStyle[t.status]
                  )}
                >
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
