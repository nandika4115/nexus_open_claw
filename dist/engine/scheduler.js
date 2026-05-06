import { toIsoTimestamp } from "../utils/time.js";
export function nextOccurrence(time, now = new Date()) {
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
export function scheduleToEvent(schedule, now = new Date()) {
    const timestamp = toIsoTimestamp(now);
    return { schedule, timestamp };
}
