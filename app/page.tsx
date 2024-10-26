import DashboardHeader from '@/components/dashboard/header';
import AlertsOverview from '@/components/dashboard/alerts-overview';
import CasesTrend from '@/components/dashboard/cases-trend';
import EstablishmentMap from '@/components/dashboard/establishment-map';
import RecentCases from '@/components/dashboard/recent-cases';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader />
        
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