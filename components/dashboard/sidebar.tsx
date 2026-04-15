'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Agent } from '@/types';
import { LayoutDashboard, Activity, CheckSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentAvatar } from '@/components/agent-avatar';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Mission Control</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-skylark-blue/10 text-skylark-blue'
              : 'text-muted-foreground hover:bg-skylark-sand/20 hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Link>

        <Link
          href="/activity"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/activity'
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Feed
        </Link>

        <Link
          href="/tasks"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/tasks'
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Tasks
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
                  <AgentAvatar name={agent.name} size="sm" />
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
    </>
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside className="hidden h-full w-64 flex-col border-r bg-background md:flex">
        {sidebarContent}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
