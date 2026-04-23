import { PublicCalendarView } from "@/components/public/public-calendar-view";
import { getAllEvents } from "@/features/events/services/events.service";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export default async function BossPage() {
  const supabase = await createClient();
  const events = await getAllEvents();
  const eventIds = events.map((event) => event.id);
  let attachments: EventAttachmentRecord[] = [];

  if (eventIds.length > 0) {
    const { data } = await supabase
      .from("event_attachments")
      .select("*")
      .in("event_id", eventIds)
      .order("created_at", { ascending: true });
    attachments = (data as EventAttachmentRecord[]) ?? [];
  }

  return <PublicCalendarView events={events} attachments={attachments} />;
}
