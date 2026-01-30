// src/app/lib/business-hours.ts
// Utility functions for business hours and rate limiting

/**
 * Get the current "business date" for a given timezone
 * This is the calendar date at the business location
 */
export function getBusinessDate(timezone: string = 'America/Los_Angeles'): string {
  try {
    const now = new Date();
    // Get date string in the business's timezone (YYYY-MM-DD format)
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    return dateStr;
  } catch (error) {
    // Fallback to UTC date if timezone is invalid
    console.error('[Business Hours] Invalid timezone, falling back to UTC:', timezone);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Get the start of the "business day" for rate limiting
 * Returns the start of the calendar day in the business's timezone
 */
export function getBusinessDayStart(timezone: string = 'America/Los_Angeles'): Date {
  try {
    // Get the current date string in the business timezone
    const dateStr = getBusinessDate(timezone);

    // Parse as a date at midnight in that timezone
    // We need to find the UTC equivalent of midnight in the business timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Create a date at the start of the business day
    // We'll calculate the offset by comparing current time in both timezones
    const now = new Date();
    const utcMidnight = new Date(dateStr + 'T00:00:00.000Z');

    // Get the timezone offset at this time
    const parts = formatter.formatToParts(utcMidnight);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

    // Actually, let's use a simpler approach - just calculate based on current date
    // The key is we want to check scans on the same calendar date in the business timezone

    // Get current time components in the timezone
    const nowInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    // Parse MM/DD/YYYY format
    const [month, day, year] = nowInTz.split('/');

    // Return a Date object representing midnight in the business timezone
    // This is approximate but good enough for same-day comparison
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  } catch (error) {
    console.error('[Business Hours] Error calculating business day start:', error);
    // Fallback to start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }
}

/**
 * Check if a timestamp is within the current business day
 */
export function isWithinCurrentBusinessDay(
  timestamp: Date,
  timezone: string = 'America/Los_Angeles'
): boolean {
  const timestampDate = timestamp.toLocaleDateString('en-CA', { timeZone: timezone });
  const currentDate = getBusinessDate(timezone);
  return timestampDate === currentDate;
}

/**
 * Get when the next business day starts for rate limiting message
 */
export function getNextBusinessDayStart(timezone: string = 'America/Los_Angeles'): Date {
  try {
    const now = new Date();
    const currentDate = getBusinessDate(timezone);

    // Parse current date and add one day
    const [year, month, day] = currentDate.split('-').map(Number);
    const nextDay = new Date(year, month - 1, day + 1);

    // Return midnight of the next day (approximate)
    return nextDay;
  } catch (error) {
    // Fallback to tomorrow UTC
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }
}

/**
 * Check if business is currently open
 */
export function isBusinessOpen(
  openTime: string | null,
  closeTime: string | null,
  daysOpen: number[] | null,
  timezone: string = 'America/Los_Angeles'
): { isOpen: boolean; opensAt?: string; closesAt?: string } {
  // If no hours configured, assume always open
  if (!openTime || !closeTime) {
    return { isOpen: true };
  }

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(now);
    const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';

    const currentTime = `${getVal('hour')}:${getVal('minute')}`;
    const dayOfWeek = new Date().toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });

    // Map day name to number (0 = Sunday)
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const dayNum = dayMap[dayOfWeek] ?? 0;

    // Check if open today
    if (daysOpen && !daysOpen.includes(dayNum)) {
      return { isOpen: false, opensAt: openTime, closesAt: closeTime };
    }

    // Check time
    const isOpen = currentTime >= openTime && currentTime < closeTime;
    return { isOpen, opensAt: openTime, closesAt: closeTime };
  } catch (error) {
    console.error('[Business Hours] Error checking if open:', error);
    return { isOpen: true };
  }
}
