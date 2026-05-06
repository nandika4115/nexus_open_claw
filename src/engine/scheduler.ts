import { toIsoTimestamp } from "../utils/time.js";

export interface DailySchedule {
  name: string;
  time: string; // HH:mm
}

export interface ScheduledEvent {
  schedule: DailySchedule;
  timestamp: string;
}

export function nextOccurrence(time: string, now: Date = new Date()): Date {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function scheduleToEvent(schedule: DailySchedule, now: Date = new Date()): ScheduledEvent {
  const timestamp = toIsoTimestamp(now);
  return { schedule, timestamp };
}
