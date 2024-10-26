import DashboardHeader from '@/components/dashboard/header';
import AlertsOverview from '@/components/dashboard/alerts-overview';
import CasesTrend from '@/components/dashboard/cases-trend';
import EstablishmentMap from '@/components/dashboard/establishment-map';
import RecentCases from '@/components/dashboard/recent-cases';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

async function getStats() {
  const supabase = createClient();
  
  const [alertsCount, totalCases, establishmentsCount] = await Promise.all([
    supabase.from('alerts').select('*', { count: 'exact' }),
    supabase.from('cases').select('*', { count: 'exact' }),
    supabase.from('establishments').select('*', { count: 'exact' }),
  ]);

  return {
    activeAlerts: alertsCount.count || 0,
    totalCases: totalCases.count || 0,
    establishments: establishmentsCount.count || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader stats={stats} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AlertsOverview />
          <CasesTrend />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EstablishmentMap />
          </div>
          <RecentCases />
        </div>
      </div>
    </main>
  );
}