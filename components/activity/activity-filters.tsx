'use client';

import { AgentAvatar } from '@/components/agent-avatar';
import type { Agent, EventStatus } from '@/types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFiltersProps {
  agents: Agent[];
  selectedAgents: string[];
  selectedStatuses: EventStatus[];
  onAgentToggle: (agentId: string) => void;
  onStatusToggle: (status: EventStatus) => void;
  onClearFilters: () => void;
}

const statusOptions: { value: EventStatus; label: string; dot: string }[] = [
  { value: 'pending', label: 'Pending', dot: 'bg-muted-foreground/60' },
  { value: 'running', label: 'Running', dot: 'bg-skylark-blue' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
  { value: 'failed', label: 'Failed', dot: 'bg-red-500' },
];

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
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Agents
      </span>
      {agents.map((agent) => {
        const active = selectedAgents.includes(agent.id);
        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onAgentToggle(agent.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-colors',
              active
                ? 'border-skylark-blue bg-skylark-blue/10 text-skylark-blue'
                : 'border-border bg-transparent text-muted-foreground hover:bg-skylark-sand/20 hover:text-foreground'
            )}
          >
            <AgentAvatar
              name={agent.name}
              size="sm"
              className="h-5 w-5 [&>svg]:h-3 [&>svg]:w-3"
            />
            {agent.name}
          </button>
        );
      })}

      <span className="mx-2 hidden h-5 w-px bg-border sm:block" />

      <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Status
      </span>
      {statusOptions.map((opt) => {
        const active = selectedStatuses.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusToggle(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-skylark-blue bg-skylark-blue/10 text-skylark-blue'
                : 'border-border bg-transparent text-muted-foreground hover:bg-skylark-sand/20 hover:text-foreground'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', opt.dot)} />
            {opt.label}
          </button>
        );
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
