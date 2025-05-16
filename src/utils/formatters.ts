import { format, formatDistance, formatRelative } from 'date-fns'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'PP')
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'p')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'PPp')
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return '';
  return formatDistance(new Date(date), new Date(), { addSuffix: true })
}

export function formatRelativeTime(date: string | Date | null | undefined, relativeTo?: Date): string {
  if (!date) return '';
  return formatRelative(new Date(date), relativeTo || new Date())
}

export function wordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length
}

export function truncate(text: string | null | undefined, length: number = 100): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...'
}

// Add other formatters as needed...