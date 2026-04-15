import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('name');

  const sortedAgents = (agents || []).slice().sort((a, b) => {
    if (a.name === 'Stella') return -1;
    if (b.name === 'Stella') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar agents={sortedAgents} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 md:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
