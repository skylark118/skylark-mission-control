'use client';

import { usePathname } from 'next/navigation';

const pathLabels: Record<string, string> = {
  '/': 'Overview',
  '/activity': 'Activity Feed',
  '/tasks': 'Tasks',
};

export function Header() {
  const pathname = usePathname();
  const label = pathLabels[pathname] ?? '';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 pr-4 pl-20 backdrop-blur md:px-8">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </header>
  );
}
