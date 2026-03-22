'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Agent } from '@/types';
import { LayoutDashboard, Activity } from 'lucide-react';

interface SidebarProps {
  agents: Agent[];
}

const statusConfig = {
  active: { color: 'bg-green-500', pulse: true },
  idle: { color: 'bg-blue-500', pulse: false },
  error: { color: 'bg-amber-500', pulse: false },
  offline: { color: 'bg-gray-500', pulse: false },
};

export function Sidebar({ agents }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Mission Control</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Link>

        <Link
          href="/activity"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/activity'
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Feed
        </Link>

        <div className="pt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
            Agents
          </h3>
          <div className="space-y-1">
            {agents.map((agent) => {
              const config = statusConfig[agent.status];
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-xl">{agent.avatar_emoji}</span>
                  <span className="flex-1">{agent.name}</span>
                  <div
                    className={`h-2 w-2 rounded-full ${config.color} ${
                      config.pulse ? 'animate-pulse' : ''
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
