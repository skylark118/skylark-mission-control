'use client';

import { usePathname } from 'next/navigation';

const pathLabels: Record<string, string> = {
  '/': 'Overview',
  '/tasks': 'Tasks',
  '/agents': 'Agents',
  '/team': 'Team',
  '/projects': 'Projects',
  '/memory': 'Memory',
  '/calendar': 'Calendar',
};

export function Header() {
  const pathname = usePathname();
  const label = pathLabels[pathname] ?? '';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 pr-4 pl-20 backdrop-blur md:px-8">
      <h1 className="text-base font-semibold tracking-tight">{label}</h1>
    </header>
  );
}
