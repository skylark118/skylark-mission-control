'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Agent, AgentEvent, Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { AgentAvatar } from '@/components/agent-avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Wrench } from 'lucide-react';

interface AgentsViewProps {
  initialAgents: Agent[];
  initialEvents: AgentEvent[];
  initialTasks: Task[];
}

type DerivedStatus = 'working' | 'idle' | 'error' | 'offline';

interface StatusInfo {
  status: DerivedStatus;
  label: string;
  dot: string;
  pulse: boolean;
  badge: string;
}

function deriveStatus(
  agent: Agent,
  latestEvent: AgentEvent | null,
  activeTask: Task | null
): StatusInfo {
  const now = Date.now();
  const heartbeatAge = agent.last_heartbeat
    ? (now - new Date(agent.last_heartbeat).getTime()) / 60000
    : null;
  const eventAge = latestEvent
    ? (now - new Date(latestEvent.created_at).getTime()) / 60000
    : null;

  if (latestEvent && latestEvent.status === 'failed' && eventAge !== null && eventAge < 30) {
    return {
      status: 'error',
      label: 'Error',
      dot: 'bg-red-500',
      pulse: false,
      badge: 'bg-red-500/10 text-red-600 border-red-500/40',
    };
  }

  if (activeTask || (eventAge !== null && eventAge < 5)) {
    return {
      status: 'working',
      label: 'Working',
      dot: 'bg-emerald-500',
      pulse: true,
      badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40',
    };
  }

  if (heartbeatAge !== null && heartbeatAge > 120) {
    return {
      status: 'offline',
      label: 'Offline',
      dot: 'border border-muted-foreground bg-transparent',
      pulse: false,
      badge: 'bg-muted text-muted-foreground border-border',
    };
  }

  return {
    status: 'idle',
    label: 'Idle',
    dot: 'border border-skylark-blue bg-transparent',
    pulse: false,
    badge: 'bg-skylark-blue/10 text-skylark-blue border-skylark-blue/40',
  };
}

const roleLabels: Record<string, string> = {
  orchestrator: 'Chief of Staff',
  engineering: 'Engineering',
  research: 'Research',
  content: 'Content',
};

export function AgentsView({ initialAgents, initialEvents, initialTasks }: AgentsViewProps) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [supabase] = useState(() => createClient());

  // Real-time: agent_events + tasks via postgres_changes
  useEffect(() => {
    const eventsChannel = supabase
      .channel('agents-page-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents((prev) => [payload.new as AgentEvent, ...prev].slice(0, 40));
          } else if (payload.eventType === 'UPDATE') {
            setEvents((prev) =>
              prev.map((e) => (e.id === payload.new.id ? (payload.new as AgentEvent) : e))
            );
          }
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('agents-page-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) => {
              const updated = prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Task) : t
              );
              return updated.filter(
                (t) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'blocked'
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [supabase]);

  // Poll last_heartbeat every 30s to keep status derivations fresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('agents').select('*');
      if (data) setAgents((prev) => {
        const order = prev.map((a) => a.id);
        const map = (data as Agent[]).reduce((acc, a) => {
          acc[a.id] = a;
          return acc;
        }, {} as Record<string, Agent>);
        return order.map((id) => map[id]).filter(Boolean);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  const eventByAgent = useMemo(() => {
    const map: Record<string, AgentEvent> = {};
    for (const e of events) {
      if (!map[e.agent_id]) map[e.agent_id] = e;
    }
    return map;
  }, [events]);

  const activeTaskByAgent = useMemo(() => {
    const map: Record<string, Task> = {};
    for (const t of tasks) {
      if (t.status === 'in_progress' && t.assigned_to && !map[t.assigned_to]) {
        map[t.assigned_to] = t;
      }
    }
    // Fall back to most recent pending/blocked task per agent
    for (const t of tasks) {
      if (t.assigned_to && !map[t.assigned_to]) map[t.assigned_to] = t;
    }
    return map;
  }, [tasks]);

  const agentById = useMemo(() => {
    const map: Record<string, Agent> = {};
    for (const a of agents) map[a.id] = a;
    return map;
  }, [agents]);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </h2>
          <p className="text-xs text-muted-foreground">{agents.length} agents</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {agents.map((agent) => {
            const latestEvent = eventByAgent[agent.id] ?? null;
            const activeTask = activeTaskByAgent[agent.id] ?? null;
            const info = deriveStatus(agent, latestEvent, activeTask);
            return (
              <AgentStatusCard
                key={agent.id}
                agent={agent}
                info={info}
                latestEvent={latestEvent}
                activeTask={activeTask}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live Activity
          </h2>
          <p className="text-xs text-muted-foreground">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No recent activity
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 20).map((e) => (
              <LiveEventRow key={e.id} event={e} agent={agentById[e.agent_id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AgentStatusCard({
  agent,
  info,
  latestEvent,
  activeTask,
}: {
  agent: Agent;
  info: StatusInfo;
  latestEvent: AgentEvent | null;
  activeTask: Task | null;
}) {
  const currentWork =
    activeTask?.title ??
    latestEvent?.action ??
    'Standing by';
  const lastActiveSource = agent.last_heartbeat || latestEvent?.created_at;
  const roleLabel = roleLabels[agent.role] ?? agent.role;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AgentAvatar name={agent.name} size="lg" />
            <div>
              <h3 className="text-base font-semibold leading-tight">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
              info.badge
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', info.dot, info.pulse && 'animate-pulse')} />
            {info.label}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          {agent.default_model && (
            <Row label="Model" value={agent.default_model} mono />
          )}
          <Row
            label="Now"
            value={currentWork}
            icon={<Wrench className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />}
          />
          {lastActiveSource && (
            <Row
              label="Last active"
              value={formatDistanceToNow(new Date(lastActiveSource), { addSuffix: true })}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-20 flex-none text-muted-foreground">{label}</span>
      {icon}
      <span className={cn('text-foreground', mono && 'font-mono text-[11px]')}>{value}</span>
    </div>
  );
}

function LiveEventRow({ event, agent }: { event: AgentEvent; agent?: Agent }) {
  const statusStyle: Record<AgentEvent['status'], string> = {
    pending: 'text-muted-foreground',
    running: 'text-skylark-blue',
    completed: 'text-emerald-700',
    failed: 'text-red-600',
  };

  return (
    <article className="flex items-start gap-3 rounded-lg border bg-card px-4 py-2.5">
      {agent ? (
        <AgentAvatar name={agent.name} size="md" />
      ) : (
        <span className="h-10 w-10 flex-none rounded-full bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {agent && <span className="text-sm font-semibold">{agent.name}</span>}
          <span className="text-xs text-muted-foreground">{event.event_type.replace(/_/g, ' ')}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="mt-0.5 text-sm">{event.action}</p>
      </div>
      <span className={cn('flex-none text-[11px] font-medium', statusStyle[event.status])}>
        {event.status}
      </span>
    </article>
  );
}
