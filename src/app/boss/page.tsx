import { PublicCalendarView } from "@/components/public/public-calendar-view";
import { getAllEvents } from "@/features/events/services/events.service";

export const dynamic = "force-dynamic";

export default async function BossPage() {
  const events = await getAllEvents();
  return <PublicCalendarView events={events} />;
}
