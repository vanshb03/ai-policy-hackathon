// page.tsx
import DashboardContent from './DashboardContent';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';

export const revalidate = 0;

type Tables = Database['public']['Tables'];
type AlertRow = Tables['alerts']['Row'] & {
  establishments: Tables['establishments']['Row'][];
};
type CaseRow = Tables['cases']['Row'] & {
  establishments: Tables['establishments']['Row'][];
};
type EstablishmentRow = Tables['establishments']['Row'] & {
  cases: { count: number }[];
};

interface DashboardData {
  alertStats: Tables['alerts']['Row'][];
  caseStats: CaseRow[];
  symptomsData: Pick<Tables['cases']['Row'], 'symptoms'>[];
  foodsData: Pick<Tables['cases']['Row'], 'foods_consumed'>[];
  recentAlerts: AlertRow[];
  locationData: EstablishmentRow[];
}

async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  
  const [
    alertStats,
    caseStats,
    symptomsData,
    foodsData,
    recentAlerts,
    locationData
  ] = await Promise.all([
    supabase
      .from('alerts')
      .select('id, establishment_id, alert_type, severity, case_count, details, created_at')
      .order('created_at', { ascending: false }),
    
    supabase
      .from('cases')
      .select(`
        id,
        establishment_id,
        report_date,
        created_at,
        onset_date,
        symptoms,
        foods_consumed,
        patient_count,
        status,
        establishments (
          id,
          name,
          address,
          city,
          state,
          postal_code,
          latitude,
          longitude,
          created_at
        )
      `)
      .order('report_date', { ascending: false })
      .limit(100),
    
    supabase
      .from('cases')
      .select('symptoms'),
    
    supabase
      .from('cases')
      .select('foods_consumed'),
    
    supabase
      .from('alerts')
      .select(`
        id,
        establishment_id,
        alert_type,
        severity,
        case_count,
        details,
        created_at,
        establishments (
          id,
          name,
          address,
          city,
          state,
          postal_code,
          latitude,
          longitude,
          created_at
        )
      `)
      .eq('severity', 'high')
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('establishments')
      .select(`
        id,
        name,
        address,
        city,
        state,
        postal_code,
        latitude,
        longitude,
        created_at,
        cases (count)
      `)
  ]);

  return {
    alertStats: alertStats.data || [],
    caseStats: caseStats.data || [],
    symptomsData: symptomsData.data || [],
    foodsData: foodsData.data || [],
    recentAlerts: recentAlerts.data || [],
    locationData: locationData.data || []
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardContent data={data} />;
}