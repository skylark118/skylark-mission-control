import { mcClient } from '@/lib/supabase/clients';
import type { ScheduledTask } from '@/types';
import { CalendarWeekView } from '@/components/calendar/calendar-week-view';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = mcClient();
  const { data } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .order('schedule', { ascending: true });
  const tasks = (data as ScheduledTask[]) || [];

  return (
    <div>
      <CalendarWeekView tasks={tasks} />
    </div>
  );
}
