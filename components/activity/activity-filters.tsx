'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Agent, EventStatus } from '@/types';
import { X } from 'lucide-react';

interface ActivityFiltersProps {
  agents: Agent[];
  selectedAgents: string[];
  selectedStatuses: EventStatus[];
  onAgentToggle: (agentId: string) => void;
  onStatusToggle: (status: EventStatus) => void;
  onClearFilters: () => void;
}

const statusOptions: EventStatus[] = ['pending', 'running', 'completed', 'failed'];

export function ActivityFilters({
  agents,
  selectedAgents,
  selectedStatuses,
  onAgentToggle,
  onStatusToggle,
  onClearFilters,
}: ActivityFiltersProps) {
  const hasActiveFilters = selectedAgents.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-2">Agents</p>
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <Badge
                key={agent.id}
                variant={selectedAgents.includes(agent.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onAgentToggle(agent.id)}
              >
                {agent.avatar_emoji} {agent.name}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Badge
                key={status}
                variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => onStatusToggle(status)}
              >
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
