'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Agent } from '@/types';
import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Radio,
  Users,
  FolderKanban,
  Brain,
  Calendar as CalendarIcon,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AgentAvatar } from '@/components/agent-avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  agents: Agent[];
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/activity', label: 'Activity Feed', icon: Radio },
];

const workspaceNav: NavItem[] = [
  { href: '/team', label: 'Team', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
];

const statusDot: Record<Agent['status'], { color: string; pulse: boolean }> = {
  active: { color: 'bg-emerald-500', pulse: true },
  idle: { color: 'border border-skylark-blue bg-transparent', pulse: false },
  error: { color: 'bg-red-500', pulse: false },
  offline: { color: 'border border-muted-foreground bg-transparent', pulse: false },
};

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-skylark-blue/10 text-skylark-blue'
          : 'text-muted-foreground hover:bg-skylark-sand/20 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function Sidebar({ agents }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);

  const content = (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <Image
          src="/skylark-logo.png"
          alt="Skylark logo"
          width={36}
          height={36}
          className="flex-none"
        />
        <h1 className="text-base font-semibold tracking-tight">Mission Control</h1>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <SectionLabel>Main</SectionLabel>
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={close} />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Workspace</SectionLabel>
          <div className="space-y-0.5">
            {workspaceNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={close} />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Agents</SectionLabel>
          <div className="space-y-0.5">
            {agents.map((agent) => {
              const s = statusDot[agent.status];
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                >
                  <AgentAvatar name={agent.name} size="sm" />
                  <span className="flex-1 text-foreground">{agent.name}</span>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      s.color,
                      s.pulse && 'animate-pulse'
                    )}
                    aria-label={agent.status}
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

      <aside className="hidden h-full w-60 flex-col border-r bg-background md:flex">
        {content}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-background transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </aside>
    </>
  );
}
