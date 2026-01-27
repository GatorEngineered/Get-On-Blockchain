// src/app/lib/happy-hour.ts
// Happy Hour / Time-based multiplier utilities

export interface HappyHourMerchant {
  happyHourEnabled: boolean;
  happyHourMultiplier: number;
  happyHourStartTime: string | null;
  happyHourEndTime: string | null;
  happyHourDaysOfWeek: number[] | null;
  happyHourTimezone: string;
}

export interface HappyHourStatus {
  isActive: boolean;
  multiplier: number;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  enabledDays: number[];
}

/**
 * Check if happy hour is currently active for a merchant
 */
export function isHappyHourActive(merchant: HappyHourMerchant): HappyHourStatus {
  const defaultStatus: HappyHourStatus = {
    isActive: false,
    multiplier: 1,
    startTime: merchant.happyHourStartTime,
    endTime: merchant.happyHourEndTime,
    timezone: merchant.happyHourTimezone || 'America/Los_Angeles',
    enabledDays: (merchant.happyHourDaysOfWeek as number[]) || [0, 1, 2, 3, 4, 5, 6],
  };

  // Check if happy hour is enabled and configured
  if (
    !merchant.happyHourEnabled ||
    !merchant.happyHourStartTime ||
    !merchant.happyHourEndTime
  ) {
    return defaultStatus;
  }

  const timezone = merchant.happyHourTimezone || 'America/Los_Angeles';
  const now = new Date();

  // Get current time in merchant's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  });

  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0');
  const currentMinute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0');
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Get current day of week (0 = Sunday)
  const dayName = parts.find((p) => p.type === 'weekday')?.value || 'Sunday';
  const dayOfWeekMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const currentDayOfWeek = dayOfWeekMap[dayName];

  // Parse start and end times
  const [startHour, startMin] = merchant.happyHourStartTime.split(':').map(Number);
  const [endHour, endMin] = merchant.happyHourEndTime.split(':').map(Number);
  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;

  // Check if today is an enabled day
  const enabledDays = (merchant.happyHourDaysOfWeek as number[]) || [0, 1, 2, 3, 4, 5, 6];
  const isTodayEnabled = enabledDays.includes(currentDayOfWeek);

  // Check if current time is within the happy hour window
  // Handle overnight windows (e.g., 22:00 to 02:00)
  let isWithinTimeWindow: boolean;
  if (startTimeMinutes <= endTimeMinutes) {
    // Normal window (e.g., 14:00 to 17:00)
    isWithinTimeWindow =
      currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  } else {
    // Overnight window (e.g., 22:00 to 02:00)
    isWithinTimeWindow =
      currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
  }

  const isActive = isTodayEnabled && isWithinTimeWindow;

  return {
    isActive,
    multiplier: isActive ? merchant.happyHourMultiplier : 1,
    startTime: merchant.happyHourStartTime,
    endTime: merchant.happyHourEndTime,
    timezone,
    enabledDays,
  };
}

/**
 * Calculate points with happy hour multiplier applied
 */
export function calculateMultipliedPoints(
  basePoints: number,
  happyHourStatus: HappyHourStatus
): { points: number; wasMultiplied: boolean; multiplier: number } {
  if (!happyHourStatus.isActive) {
    return { points: basePoints, wasMultiplied: false, multiplier: 1 };
  }

  const multipliedPoints = Math.floor(basePoints * happyHourStatus.multiplier);
  return {
    points: multipliedPoints,
    wasMultiplied: true,
    multiplier: happyHourStatus.multiplier,
  };
}
