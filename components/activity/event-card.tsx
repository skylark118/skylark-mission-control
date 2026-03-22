import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AgentEvent, Agent } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface EventCardProps {
  event: AgentEvent;
  agent?: Agent;
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const },
  running: { label: 'Running', variant: 'default' as const },
  completed: { label: 'Completed', variant: 'outline' as const },
  failed: { label: 'Failed', variant: 'destructive' as const },
};

const agentColorMap: Record<string, string> = {
  Stella: 'border-l-blue-500',
  Cora: 'border-l-green-500',
  Remy: 'border-l-amber-500',
  Penny: 'border-l-purple-500',
};

export function EventCard({ event, agent }: EventCardProps) {
  const statusBadge = statusConfig[event.status];
  const borderColor = agent ? agentColorMap[agent.name] || 'border-l-gray-500' : 'border-l-gray-500';

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {agent && (
              <span className="text-2xl">{agent.avatar_emoji}</span>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {agent && (
                  <span className="font-semibold">{agent.name}</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {event.event_type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="font-medium">{event.action}</p>
              {event.summary && (
                <p className="text-sm text-muted-foreground">{event.summary}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {event.duration_ms && (
                  <span>• {(event.duration_ms / 1000).toFixed(1)}s</span>
                )}
              </div>
            </div>
          </div>

          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
