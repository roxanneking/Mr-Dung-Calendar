import { compareAsc, parse } from "date-fns";

import { EventRecord } from "./types";

export function sortEventsByTime(events: EventRecord[]) {
  return [...events].sort((a, b) => {
    const aStart = parse(a.start_time, "HH:mm:ss", new Date());
    const bStart = parse(b.start_time, "HH:mm:ss", new Date());
    return compareAsc(aStart, bStart);
  });
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function groupEventsByDate(events: EventRecord[]) {
  const grouped = new Map<string, EventRecord[]>();

  events.forEach((event) => {
    const bucket = grouped.get(event.date) ?? [];
    bucket.push(event);
    grouped.set(event.date, sortEventsByTime(bucket));
  });

  return grouped;
}

export function getWeekOfMonthLabel(dateISO: string) {
  const date = new Date(dateISO);
  const day = date.getDate();
  const week = Math.min(5, Math.floor((day - 1) / 7) + 1);
  return `W${week}`;
}

export function groupEventsByWeek(events: EventRecord[]) {
  const grouped = new Map<string, EventRecord[]>();
  ["W1", "W2", "W3", "W4", "W5"].forEach((week) => grouped.set(week, []));

  events.forEach((event) => {
    const week = getWeekOfMonthLabel(event.date);
    const bucket = grouped.get(week) ?? [];
    bucket.push(event);
    grouped.set(week, sortEventsByTime(bucket));
  });

  return grouped;
}
