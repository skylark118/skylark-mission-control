'use client';

import { useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
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
  const parentRef = useRef<HTMLDivElement>(null);

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

  const virtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 5,
  });

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
    <div className="space-y-4">
      <ActivityFilters
        agents={agents}
        selectedAgents={selectedAgents}
        selectedStatuses={selectedStatuses}
        onAgentToggle={handleAgentToggle}
        onStatusToggle={handleStatusToggle}
        onClearFilters={handleClearFilters}
      />

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h3 className="font-semibold">
            Activity Feed ({filteredEvents.length} events)
          </h3>
        </div>

        <div
          ref={parentRef}
          className="h-[calc(100vh-20rem)] overflow-auto p-4"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const event = filteredEvents[virtualItem.index];
              const agent = agentMap[event.agent_id];

              return (
                <div
                  key={virtualItem.key}
                  ref={virtualizer.measureElement}
                  className="pb-3"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <EventCard event={event} agent={agent} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
