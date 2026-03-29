import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatCost(usd: number): string {
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-neon-red';
    case 'high': return 'text-neon-orange';
    case 'medium': return 'text-neon-yellow';
    case 'low': return 'text-text-secondary';
    default: return 'text-text-secondary';
  }
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-950 text-neon-red border border-red-800';
    case 'high': return 'bg-orange-950 text-neon-orange border border-orange-800';
    case 'medium': return 'bg-yellow-950 text-neon-yellow border border-yellow-800';
    case 'low': return 'bg-bg-elevated text-text-secondary border border-bg-border';
    default: return 'bg-bg-elevated text-text-secondary border border-bg-border';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-neon-green';
    case 'in_progress': return 'text-neon-cyan';
    case 'completed': return 'text-neon-green';
    case 'blocked': return 'text-neon-red';
    case 'idle': return 'text-text-secondary';
    case 'offline': return 'text-text-muted';
    case 'healthy': return 'text-neon-green';
    case 'degraded': return 'text-neon-yellow';
    case 'down': return 'text-neon-red';
    default: return 'text-text-secondary';
  }
}

export function statusDot(status: string): string {
  switch (status) {
    case 'active':
    case 'healthy': return 'bg-neon-green shadow-neon-green';
    case 'in_progress': return 'bg-neon-cyan shadow-neon-cyan';
    case 'completed': return 'bg-neon-green';
    case 'blocked':
    case 'down': return 'bg-neon-red shadow-neon-red';
    case 'degraded': return 'bg-neon-yellow shadow-neon-yellow';
    case 'idle': return 'bg-text-secondary';
    case 'offline': return 'bg-text-muted';
    default: return 'bg-text-muted';
  }
}

export function truncate(str: string, len = 80): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

// Generate a deterministic avatar color from a seed string
export function avatarColor(seed: string): string {
  const colors = [
    '#39d353', '#58a6ff', '#f0c060', '#bc8cff',
    '#e8812a', '#f85149', '#79c0ff', '#7ee787',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

// Generate initials from name
export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
