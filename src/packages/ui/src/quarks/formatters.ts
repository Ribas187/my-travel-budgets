import { SUPPORTED_CURRENCIES } from '@repo/core';

export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDayLabel(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateRange(startDate: string, endDate: string, locale: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Intl.DateTimeFormat(locale, opts).format(new Date(startDate));
  const end = new Intl.DateTimeFormat(locale, { ...opts, year: 'numeric' }).format(
    new Date(endDate),
  );
  return `${start} – ${end}`;
}

export function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'));
}

interface MemberLike {
  user?: { name?: string | null; email?: string | null } | null;
  guestName?: string | null;
}

export function getMemberDisplayName(member: MemberLike, unknownLabel = ''): string {
  if (member.user?.name) return member.user.name;
  if (member.guestName) return member.guestName;
  return member.user?.email ?? unknownLabel;
}

export function getMemberInitial(member: MemberLike): string {
  const name = getMemberDisplayName(member);
  return name.charAt(0).toUpperCase();
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.symbol ?? currencyCode;
}

export function getDaysSinceStart(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const effectiveEnd = today < end ? today : end;
  const diffMs = effectiveEnd.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

export function getTripTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

export const AVATAR_COLORS = [
  '#FF6B35',
  '#0EA5E9',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F59E0B',
  '#EF4444',
  '#6366F1',
  '#C2410C',
  '#0D9488',
];

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]!;
}
