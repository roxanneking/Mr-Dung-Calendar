export type EventCategory =
  | "meeting"
  | "business_trip"
  | "internal"
  | "client"
  | "other";

export interface EventRecord {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  category: EventCategory;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventFormInput {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  category: EventCategory;
  color: string;
}
