import { EventCategory } from "./types";

export const EVENT_CATEGORIES: { label: string; value: EventCategory }[] = [
  { label: "Họp nội bộ", value: "internal" },
  { label: "Họp đối tác", value: "client" },
  { label: "Đi công tác", value: "business_trip" },
  { label: "Lịch họp chung", value: "meeting" },
  { label: "Khác", value: "other" }
];

export const EVENT_COLORS = [
  "#047857",
  "#059669",
  "#0ea5e9",
  "#7c3aed",
  "#dc2626",
  "#ca8a04"
];
