import { Card, CardContent } from '@/components/ui/card';
import { AgentAvatar } from '@/components/agent-avatar';
import type { Agent, AgentEvent, Task } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CompactAgentCardProps {
  agent: Agent;
  latestEvent: AgentEvent | null;
  activeTask: Task | null;
}

function deriveStatus(
  agent: Agent,
  latestEvent: AgentEvent | null,
  activeTask: Task | null
): { label: string; dot: string; pulse: boolean; badge: string } {
  const now = Date.now();
  const eventAge = latestEvent
    ? (now - new Date(latestEvent.created_at).getTime()) / 60000
    : null;
  const heartbeatAge = agent.last_heartbeat
    ? (now - new Date(agent.last_heartbeat).getTime()) / 60000
    : null;

  if (latestEvent?.status === 'failed' && eventAge !== null && eventAge < 30) {
    return {
      label: 'Error',
      dot: 'bg-red-500',
      pulse: false,
      badge: 'text-red-600',
    };
  }
  if (activeTask || (eventAge !== null && eventAge < 5)) {
    return {
      label: 'Working',
      dot: 'bg-emerald-500',
      pulse: true,
      badge: 'text-emerald-700',
    };
  }
  if (heartbeatAge !== null && heartbeatAge > 120) {
    return {
      label: 'Offline',
      dot: 'bg-muted-foreground',
      pulse: false,
      badge: 'text-muted-foreground',
    };
  }
  return {
    label: 'Idle',
    dot: 'bg-skylark-blue',
    pulse: false,
    badge: 'text-skylark-blue',
  };
}

const roleLabels: Record<string, string> = {
  orchestrator: 'Chief of Staff',
  engineering: 'Engineering',
  research: 'Research',
  content: 'Content',
};

export function CompactAgentCard({
  agent,
  latestEvent,
  activeTask,
}: CompactAgentCardProps) {
  const status = deriveStatus(agent, latestEvent, activeTask);
  const lastActiveSource = agent.last_heartbeat || latestEvent?.created_at;
  const roleLabel = roleLabels[agent.role] ?? agent.role;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <AgentAvatar name={agent.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
            <span className={cn('flex items-center gap-1 text-[11px] font-medium', status.badge)}>
              <span
                className={cn('h-1.5 w-1.5 rounded-full', status.dot, status.pulse && 'animate-pulse')}
              />
              {status.label}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {lastActiveSource
              ? `Last: ${formatDistanceToNow(new Date(lastActiveSource), { addSuffix: true })}`
              : 'No activity yet'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
