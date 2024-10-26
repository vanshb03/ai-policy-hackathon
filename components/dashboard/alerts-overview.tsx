"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Database } from '@/lib/supabase/types';

type Alert = Database['public']['Tables']['alerts']['Row'];

export default function AlertsOverview() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*, establishments(*)')
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setAlerts(data);
    };

    fetchAlerts();

    const channel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.severity === 'high' ? 'destructive' : 'default'}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{alert.alert_type}</AlertTitle>
            <AlertDescription>{alert.details}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}