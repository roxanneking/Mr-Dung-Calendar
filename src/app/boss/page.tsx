import { PublicCalendarView } from "@/components/public/public-calendar-view";
import { EventAttachmentRecord } from "@/features/attachments/types";
import { getAllEvents } from "@/features/events/services/events.service";
import { createClient as createServerSupabaseClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export default async function BossPage() {
  const events = await getAllEvents();
  const supabase = await createServerSupabaseClient();
  const eventIds = events.map((event) => event.id);
  const attachmentsByEvent = new Map<string, EventAttachmentRecord[]>();

  if (eventIds.length > 0) {
    const { data: attachments } = await supabase
      .from("event_attachments")
      .select("*")
      .in("event_id", eventIds)
      .order("created_at", { ascending: true });

    (attachments as EventAttachmentRecord[] | null)?.forEach((attachment) => {
      const bucket = attachmentsByEvent.get(attachment.event_id) ?? [];
      bucket.push(attachment);
      attachmentsByEvent.set(attachment.event_id, bucket);
    });
  }

  return <PublicCalendarView events={events} attachmentsByEvent={attachmentsByEvent} />;
}
