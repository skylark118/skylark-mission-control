'use client';

import { useState, useMemo } from 'react';
import type { AgentEvent, Agent, EventStatus } from '@/types';
import { EventCard } from './event-card';
import { ActivityFilters } from './activity-filters';
import { useRealtimeEvents } from '@/lib/hooks/use-realtime-events';

interface ActivityFeedProps {
  initialEvents: AgentEvent[];
  agents: Agent[];
}

export function ActivityFeed({ initialEvents, agents }: ActivityFeedProps) {
  const events = useRealtimeEvents(initialEvents);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<EventStatus[]>([]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (selectedAgents.length > 0 && !selectedAgents.includes(event.agent_id)) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(event.status)) {
        return false;
      }
      return true;
    });
  }, [events, selectedAgents, selectedStatuses]);

  const agentMap = useMemo(() => {
    return agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, Agent>);
  }, [agents]);

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleStatusToggle = (status: EventStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedAgents([]);
    setSelectedStatuses([]);
  };

  return (
    <div className="space-y-5">
      <ActivityFilters
        agents={agents}
        selectedAgents={selectedAgents}
        selectedStatuses={selectedStatuses}
        onAgentToggle={handleAgentToggle}
        onStatusToggle={handleStatusToggle}
        onClearFilters={handleClearFilters}
      />

      <p className="text-xs text-muted-foreground">
        {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
      </p>

      {filteredEvents.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No events match the current filters.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const agent = agentMap[event.agent_id];
            return <EventCard key={event.id} event={event} agent={agent} />;
          })}
        </div>
      )}
    </div>
  );
}
