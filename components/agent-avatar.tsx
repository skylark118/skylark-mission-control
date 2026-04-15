import { Bot, Feather, Microscope, Star, Wrench, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface AvatarStyle {
  icon: LucideIcon;
  bg: string;
  text: string;
}

const defaultStyle: AvatarStyle = {
  icon: Bot,
  bg: 'bg-skylark-sky/25',
  text: 'text-skylark-blue',
};

const nameToStyle: Record<string, AvatarStyle> = {
  Stella: {
    icon: Star,
    bg: 'bg-[#F5B94A]/25',
    text: 'text-[#C98A1A]',
  },
  Cora: {
    icon: Wrench,
    bg: 'bg-skylark-blue/15',
    text: 'text-skylark-blue',
  },
  Penny: {
    icon: Feather,
    bg: 'bg-skylark-sky/40',
    text: 'text-[#4A6F93]',
  },
  Remy: {
    icon: Microscope,
    bg: 'bg-skylark-sand/40',
    text: 'text-skylark-slate',
  },
};

const sizeClasses = {
  sm: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
  lg: 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6',
};

export function AgentAvatar({ name, size = 'md', className }: AgentAvatarProps) {
  const style = nameToStyle[name] ?? defaultStyle;
  const Icon = style.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        style.bg,
        style.text,
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <Icon strokeWidth={1.5} />
    </span>
  );
}
