import { EventCategory } from "./types";

export const PRIORITY_OPTIONS: {
  label: "Quan trọng" | "Trung bình" | "Thấp";
  value: EventCategory;
  color: string;
}[] = [
  { label: "Quan trọng", value: "client", color: "#dc2626" },
  { label: "Trung bình", value: "meeting", color: "#f59e0b" },
  { label: "Thấp", value: "other", color: "#059669" }
];

const PRIORITY_BY_CATEGORY: Record<
  EventCategory,
  { label: "Quan trọng" | "Trung bình" | "Thấp"; color: string }
> = {
  client: { label: "Quan trọng", color: "#dc2626" },
  business_trip: { label: "Quan trọng", color: "#dc2626" },
  meeting: { label: "Trung bình", color: "#f59e0b" },
  internal: { label: "Trung bình", color: "#f59e0b" },
  other: { label: "Thấp", color: "#059669" }
};

export function getPriorityMeta(category: EventCategory) {
  return PRIORITY_BY_CATEGORY[category] ?? PRIORITY_BY_CATEGORY.other;
}
