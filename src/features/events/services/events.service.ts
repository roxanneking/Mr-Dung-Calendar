import { createClient as createServerSupabaseClient } from "@/supabase/server";
import { EventFormInput, EventRecord } from "../types";

export async function getEventsForMonth(month: Date): Promise<EventRecord[]> {
  const supabase = await createServerSupabaseClient();
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EventRecord[];
}

export async function getAllEvents(): Promise<EventRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EventRecord[];
}

export const DEFAULT_EVENT_FORM: EventFormInput = {
  title: "",
  date: "",
  start_time: "09:00",
  end_time: "10:00",
  location: "",
  description: "",
  owner: "",
  deadline: "",
  status: "",
  result: "",
  notes: "",
  category: "meeting",
  color: "#059669"
};
