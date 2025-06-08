/**
 * Date utility functions for safe date handling across the application
 */

/**
 * Safely converts a value to a Date object
 * Handles both string and Date inputs
 */
export function safeParseDate(value: any): Date {
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date value:', value);
      return new Date(); // Return current date as fallback
    }
    return parsed;
  }
  
  console.warn('Invalid date type:', typeof value, value);
  return new Date(); // Return current date as fallback
}

/**
 * Safely gets the time from a date value
 * Returns current time if date is invalid
 */
export function safeGetTime(value: any): number {
  const date = safeParseDate(value);
  return date.getTime();
}

/**
 * Formats a date value safely for display
 */
export function safeDateFormat(value: any, options?: Intl.DateTimeFormatOptions): string {
  const date = safeParseDate(value);
  return date.toLocaleDateString('zh-CN', options);
}

/**
 * Formats a date and time value safely for display
 */
export function safeDateTimeFormat(value: any): string {
  const date = safeParseDate(value);
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN')}`;
}

/**
 * Calculates days until a due date
 */
export function getDaysUntilDue(dueDate: any): number {
  const due = safeParseDate(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats due date for display (e.g., "3天后", "已到期")
 */
export function formatDueDate(dueDate: any): string {
  const due = safeParseDate(dueDate);
  const now = new Date();
  
  if (due <= now) {
    return '已到期';
  }
  
  const days = getDaysUntilDue(dueDate);
  return `${days}天后`;
} 