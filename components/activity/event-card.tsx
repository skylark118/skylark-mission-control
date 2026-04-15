import { AgentAvatar } from '@/components/agent-avatar';
import type { AgentEvent, Agent } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: AgentEvent;
  agent?: Agent;
}

const statusStyle: Record<
  AgentEvent['status'],
  { label: string; dot: string; text: string }
> = {
  pending: { label: 'Pending', dot: 'bg-muted-foreground/60', text: 'text-muted-foreground' },
  running: { label: 'Running', dot: 'bg-skylark-blue animate-pulse', text: 'text-skylark-blue' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  failed: { label: 'Failed', dot: 'bg-red-500', text: 'text-red-600' },
};

export function EventCard({ event, agent }: EventCardProps) {
  const s = statusStyle[event.status];

  return (
    <article className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-skylark-blue/40">
      {agent && <AgentAvatar name={agent.name} size="md" />}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {agent && (
            <span className="text-sm font-semibold text-foreground">{agent.name}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {event.event_type.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </span>
          {event.duration_ms != null && (
            <span className="text-xs text-muted-foreground">
              · {(event.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm text-foreground">{event.action}</p>

        {event.summary && (
          <p className="mt-1 text-xs text-muted-foreground">{event.summary}</p>
        )}
      </div>

      <div className="flex flex-none items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
        <span className={cn('text-xs font-medium', s.text)}>{s.label}</span>
      </div>
    </article>
  );
}
