'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
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
    estimateSize: () => 92,
    measureElement: (element) => element.getBoundingClientRect().height,
    gap: 8,
    overscan: 5,
    enabled: !isMobile,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const onChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    onChange();
    mediaQuery.addEventListener('change', onChange);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      virtualizer.measure();
    }
  }, [isMobile, filteredEvents, virtualizer]);

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

      <div
        ref={parentRef}
        className="h-[calc(100vh-16rem)] overflow-auto pr-1"
      >
        {filteredEvents.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No events match the current filters.
          </p>
        ) : isMobile ? (
          <div className="space-y-2">
            {filteredEvents.map((event) => {
              const agent = agentMap[event.agent_id];
              return <EventCard key={event.id} event={event} agent={agent} />;
            })}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
