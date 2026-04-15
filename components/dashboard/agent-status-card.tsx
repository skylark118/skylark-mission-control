import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/components/agent-avatar';
import type { AgentWithEvents } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface AgentStatusCardProps {
  agent: AgentWithEvents;
  onClick?: () => void;
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500', pulse: true },
  idle: { label: 'Idle', color: 'bg-blue-500', pulse: false },
  error: { label: 'Error', color: 'bg-amber-500', pulse: false },
  offline: { label: 'Offline', color: 'bg-gray-500', pulse: false },
};

export function AgentStatusCard({ agent, onClick }: AgentStatusCardProps) {
  const config = statusConfig[agent.status];
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <AgentAvatar name={agent.name} size="lg" />
          <div>
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${config.color} ${
              config.pulse ? 'animate-pulse' : ''
            }`}
          />
          <Badge variant="outline">{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {agent.latest_event && (
          <div className="text-sm">
            <p className="text-muted-foreground">Latest activity:</p>
            <p className="font-medium truncate">{agent.latest_event.action}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(agent.latest_event.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
