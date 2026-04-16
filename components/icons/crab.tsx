import { cn } from '@/lib/utils';

interface CrabIconProps {
  className?: string;
  strokeWidth?: number;
}

export function Crab({ className, strokeWidth = 1.5 }: CrabIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden="true"
    >
      {/* Body */}
      <path d="M5 13c0-2.5 3-4.5 7-4.5s7 2 7 4.5v1c0 1.4-3 2.5-7 2.5s-7-1.1-7-2.5v-1Z" />
      {/* Eye stalks */}
      <path d="M10 8.8V7" />
      <path d="M14 8.8V7" />
      {/* Eyes */}
      <circle cx="10" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      {/* Left claw */}
      <path d="M6.5 13 3.5 11.5l1 3" />
      <path d="M4.5 14.5 3 17" />
      {/* Right claw */}
      <path d="m17.5 13 3-1.5-1 3" />
      <path d="m19.5 14.5 1.5 2.5" />
      {/* Legs */}
      <path d="M8 16.2 7 19" />
      <path d="M11 16.7v2.3" />
      <path d="M13 16.7v2.3" />
      <path d="m16 16.2 1 2.8" />
    </svg>
  );
}
